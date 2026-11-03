"""Regression checks for alpha package isolation and source provenance."""
import json
import plistlib
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import package_alpha


class PackageAlphaTest(unittest.TestCase):
    def setUp(self):
        self.release = json.loads((package_alpha.ROOT / "tools/browserrad/release.json").read_text())

    def bundle(self, root):
        app = root / "BrowserRAD.app"
        (app / "Contents/MacOS").mkdir(parents=True)
        (app / "Contents/MacOS/BrowserRAD").write_bytes(b"fixture")
        (app / "Contents/Info.plist").write_bytes(plistlib.dumps({
            "CFBundleIdentifier": self.release["bundle_id"],
            "CFBundleExecutable": "BrowserRAD",
        }))
        return app

    def test_rejects_stock_identity_before_executing_tools(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = self.bundle(Path(tmp))
            info = app / "Contents/Info.plist"
            info.write_bytes(plistlib.dumps({"CFBundleIdentifier": "com.browseros.BrowserClaw"}))
            with mock.patch.object(package_alpha.subprocess, "check_output") as run:
                with self.assertRaisesRegex(ValueError, "identity"):
                    package_alpha.validate_bundle(app, self.release)
                run.assert_not_called()

    def test_rejects_private_state_and_escaping_symlinks(self):
        for kind in ("state", "symlink"):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                app = self.bundle(root)
                if kind == "state":
                    (app / "Contents/Cookies").write_text("synthetic")
                else:
                    (root / "outside").write_text("synthetic")
                    (app / "Contents/link").symlink_to(root / "outside")
                with mock.patch.object(package_alpha.subprocess, "check_output", return_value="arm64\n"):
                    with self.assertRaises(ValueError):
                        package_alpha.validate_bundle(app, self.release)

    def test_rejects_wrong_architecture(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = self.bundle(Path(tmp))
            with mock.patch.object(package_alpha.subprocess, "check_output", return_value="x86_64\n"):
                with self.assertRaisesRegex(ValueError, "architectures"):
                    package_alpha.validate_bundle(app, self.release)

    def test_accepts_internal_framework_symlink(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = self.bundle(Path(tmp))
            (app / "Contents/target").write_text("synthetic")
            (app / "Contents/link").symlink_to("target")
            with mock.patch.object(package_alpha.subprocess, "check_output", return_value="arm64\n"):
                self.assertEqual(package_alpha.validate_bundle(app, self.release)["CFBundleExecutable"], "BrowserRAD")

    def test_rejects_native_changes_after_build_checkpoint(self):
        with mock.patch.object(package_alpha, "git", side_effect=["", "a" * 40, "", "packages/browseros-agent/crates/browseros-mcp/src/tools/run.rs"]):
            with self.assertRaisesRegex(ValueError, "Rebuild required"):
                package_alpha.validate_source(self.release)

    def test_requires_exact_tag_source(self):
        for tagged_source in ("a" * 40, "b" * 40):
            with self.subTest(tagged_source=tagged_source), mock.patch.object(
                package_alpha, "git", side_effect=["", "a" * 40, "", "docs/browserrad/PROJECT.md", tagged_source]
            ):
                if tagged_source == "a" * 40:
                    self.assertEqual(package_alpha.validate_source(self.release), tagged_source)
                else:
                    with self.assertRaisesRegex(ValueError, "release tag"):
                        package_alpha.validate_source(self.release)

    def test_rejects_dirty_source(self):
        with mock.patch.object(package_alpha, "git", return_value=" M README.md"):
            with self.assertRaisesRegex(ValueError, "Commit reviewed"):
                package_alpha.validate_source(self.release)


if __name__ == "__main__":
    unittest.main()
