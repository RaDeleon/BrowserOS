#!/usr/bin/env python3
"""BrowserRAD — the browser for web agents."""

from pathlib import Path

from ...core.products import (
    BROWSEROS_BUG_REPORTER_EXTENSION_ID,
    BROWSERCLAW_EXTENSION_ID,
    MacProductIdentity,
    ProductDescriptor,
    WindowsProductIdentity,
)
from ..server_binaries import ServerBundle, SignSpec

BROWSERCLAW_PRODUCT = ProductDescriptor.define(
    id="browserclaw",
    display_name="BrowserRAD",
    windows_installer_guid="{D31EA8BC-25D9-4A97-91A1-10E7A1BAA42B}",
    company="TechInSF",
    homepage_url="https://github.com/RaDeleon/BrowserOS",
    support_url="https://github.com/RaDeleon/BrowserOS/discussions",
    bugtracker_url="https://github.com/RaDeleon/BrowserOS/issues",
    summary="The open source browser for web agents",
    description="BrowserRAD is a Chromium-based browser for agent workflows.",
    required_extensions=(
        (BROWSERCLAW_EXTENSION_ID, "BrowserRAD app"),
        (BROWSEROS_BUG_REPORTER_EXTENSION_ID, "BrowserOS bug reporter"),
    ),
    server_bundle_ids=("browserclaw-server",),
    artifact_prefix="BrowserRAD",
    mac=MacProductIdentity(
        bundle_id="com.techinsf.BrowserRAD",
        dev_bundle_id="com.techinsf.dev.BrowserRAD",
        signing_identifier="com.techinsf.BrowserRAD",
        dev_signing_identifier="com.techinsf.dev.BrowserRAD",
        framework_name="BrowserRAD Framework.framework",
        dev_framework_name="BrowserRAD Dev Framework.framework",
        dmg_volume_name="BrowserRAD",
    ),
    windows=WindowsProductIdentity(
        app_user_model_id="TechInSF.BrowserRAD",
        installer_app_id="{D31EA8BC-25D9-4A97-91A1-10E7A1BAA42B}",
    ),
)

BROWSERCLAW_SERVER_BUNDLE = ServerBundle(
    id="browserclaw-server",
    name="BrowserOS Claw Server",
    product_ids=("browserclaw",),
    chromium_output_root="BrowserClawServer",
    local_resources_root=Path("resources/binaries/browseros_claw_server_rust"),
    chromium_resources_root=Path("chrome/browser/browseros/claw_server/resources"),
    macos_bundle_resources_root=Path(
        "Contents/Resources/BrowserClawServer/default/resources"
    ),
    windows_bundle_resources_root=Path("BrowserClawServer/default/resources"),
    macos_binaries={
        "browseros-claw-server": SignSpec(
            "browseros_claw_server",
            "runtime",
            "browseros-executable-entitlements.plist",
        ),
    },
    windows_binaries=("browseros-claw-server.exe",),
    source_builder="cargo",
    source_component="claw-server-rust",
    runtime_binary_name="browseros-claw-server",
    required_in_chromium_output=False,
    unsigned_artifact_prefix="claw-server-rust/prod-resources",
    unsigned_artifact_base_name="browseros-claw-server-rust-resources",
)
