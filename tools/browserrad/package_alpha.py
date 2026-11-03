#!/usr/bin/env python3
"""Stage an ad-hoc BrowserRAD alpha; never install, tag or publish it."""
from __future__ import annotations

import argparse
import hashlib
import json
import plistlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages/browseros"))

from bos_build.core.context import Context
from bos_build.steps.package.macos import create_dmg
from bos_build.steps.sign.macos import (
    sign_all_components,
    verify_server_resources_bundle,
    verify_signature,
)


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def sha256(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def validate_bundle(app: Path, release: dict) -> dict:
    if app.name != "BrowserRAD.app" or app.is_symlink() or not app.is_dir():
        raise ValueError("Expected a real BrowserRAD.app directory")
    info = plistlib.loads((app / "Contents/Info.plist").read_bytes())
    if info.get("CFBundleIdentifier") != release["bundle_id"]:
        raise ValueError("Bundle identity does not match BrowserRAD")
    if info.get("CFBundleExecutable") != "BrowserRAD":
        raise ValueError("Unexpected main executable name")
    executable = app / "Contents/MacOS/BrowserRAD"
    architectures = subprocess.check_output(["lipo", "-archs", str(executable)], text=True).split()
    if architectures != [release["architecture"]]:
        raise ValueError(f"Unexpected executable architectures: {architectures}")
    for path in app.rglob("*"):
        if path.is_symlink() and not path.resolve().is_relative_to(app.resolve()):
            raise ValueError(f"Bundle symlink escapes the app: {path.relative_to(app)}")
        if path.name in {".env", "Cookies", "Login Data", "History", "Local State"} or path.suffix in {".pem", ".key", ".db", ".sqlite"}:
            raise ValueError(f"Unexpected private-state/key artifact: {path.relative_to(app)}")
    return info


def validate_source(release: dict) -> str:
    if git("status", "--porcelain"):
        raise ValueError("Commit reviewed source before packaging")
    source = git("rev-parse", "HEAD")
    git("merge-base", "--is-ancestor", release["build_source_commit"], source)
    # The running native build is pinned. Later documentation and packaging
    # changes can accompany it, but executable-source changes need a new build.
    allowed = (
        "docs/", "tools/browserrad/", "README", "AGENTS.md", "CLAUDE.md",
        "packages/browseros/bos_build/steps/sign/macos.py",
        "packages/browseros/bos_build/steps/sign/macos_test.py",
    )
    changed = git("diff", "--name-only", release["build_source_commit"], source).splitlines()
    unexpected = [path for path in changed if not path.startswith(allowed)]
    if unexpected:
        raise ValueError(f"Rebuild required for changed native/server inputs: {unexpected}")
    tagged_source = git("rev-parse", release["tag"] + "^{commit}")
    if tagged_source != source:
        raise ValueError("Check out the declared release tag before packaging")
    return source


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app", required=True, type=Path)
    parser.add_argument("--chromium-src", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    release = json.loads((ROOT / "tools/browserrad/release.json").read_text())
    if not re.fullmatch(r"\d+\.\d+\.\d+-alpha\.\d+", release["version"]):
        raise ValueError("Expected an explicit alpha version")
    if release["tag"] != "v" + release["version"]:
        raise ValueError("Release version and tag disagree")
    source = validate_source(release)
    app = args.app.absolute()
    original = validate_bundle(app, release)
    chromium = args.chromium_src.resolve()
    actual_pin = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=chromium, text=True).strip()
    if actual_pin != release["chromium_source_commit"]:
        raise ValueError("Chromium checkout pin does not match the release")
    ctx = Context(chromium_src=chromium, product="browserclaw", architecture="arm64", build_type="release")
    problems = verify_server_resources_bundle(app, chromium, "browserclaw")
    if problems:
        raise ValueError("Incomplete server resources: " + "; ".join(problems))
    output = (args.output or ROOT / "tools/browserrad/results/releases" / release["version"]).absolute()
    if not output.resolve().is_relative_to((ROOT / "tools/browserrad/results").resolve()):
        raise ValueError("Output must stay inside ignored tools/browserrad/results")
    output.mkdir(parents=True, exist_ok=False)
    staged = output / "BrowserRAD.app"
    subprocess.run(["ditto", str(app), str(staged)], check=True)
    info_path = staged / "Contents/Info.plist"
    info = plistlib.loads(info_path.read_bytes())
    info.update(CFBundleShortVersionString=release["macos_short_version"],
                CFBundleVersion=release["macos_bundle_version"],
                BrowserRADReleaseVersion=release["version"])
    info_path.write_bytes(plistlib.dumps(info))
    provenance = dict(release, release_source_commit=source,
                      original_bundle_version=original.get("CFBundleShortVersionString"),
                      browser_engine_version=ctx.browseros_chromium_version,
                      upstream_browseros_version=ctx.semantic_version)
    (staged / "Contents/Resources/browserrad-release.json").write_text(json.dumps(provenance, indent=2) + "\n")
    if not sign_all_components(staged, "-", ctx.root_dir, ctx):
        raise RuntimeError("Ad-hoc signing failed")
    if not verify_signature(staged, ctx):
        raise RuntimeError("Signature integrity check failed")
    validate_bundle(staged, release)
    dmg = output / f"BrowserRAD-{release['version']}-macos-arm64.dmg"
    if not create_dmg(staged, dmg, f"BrowserRAD {release['version']}", ctx.get_pkg_dmg_path()):
        raise RuntimeError("DMG packaging failed")
    manifest = output / "release-manifest.json"
    manifest.write_text(json.dumps(dict(provenance,
        artifact={"name": dmg.name, "bytes": dmg.stat().st_size, "sha256": sha256(dmg)},
        validation={"signature_integrity": "passed", "isolated_launch": "pending", "coexistence": "pending"}
    ), indent=2) + "\n")
    (output / "SHA256SUMS").write_text("".join(f"{sha256(p)}  {p.name}\n" for p in (dmg, manifest)))
    print(f"Staged alpha: {output}\nDo not publish until isolated launch and coexistence validation pass.")


if __name__ == "__main__":
    main()
