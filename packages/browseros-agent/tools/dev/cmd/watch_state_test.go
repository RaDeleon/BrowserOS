package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"browseros-dev/proc"
)

func TestBrowserRADWatchKeepsStateWithItsProfile(t *testing.T) {
	t.Setenv("BROWSERRAD_DIR", "")
	var previous string
	for range 2 {
		profile := t.TempDir()
		env, err := buildWatchEnv(proc.Ports{}, profile, true, false)
		if err != nil {
			t.Fatal(err)
		}
		state := envValue(env, "BROWSERRAD_DIR")
		if state != filepath.Join(profile, clawWatchStateDirName) {
			t.Fatalf("BrowserRAD state %s is outside profile %s", state, profile)
		}
		if state == previous {
			t.Fatalf("separate profiles reused state %s", state)
		}
		previous = state
	}
}

func TestFreshBrowserRADWatchUsesFreshProfileState(t *testing.T) {
	t.Setenv("BROWSERRAD_DIR", "")
	profile := t.TempDir()
	env, err := buildWatchEnv(proc.Ports{}, profile, true, true)
	if err != nil {
		t.Fatal(err)
	}
	if got := envValue(env, "BROWSERRAD_DIR"); got != filepath.Join(profile, clawWatchStateDirName) {
		t.Fatalf("fresh profile state = %s", got)
	}
}

func TestBrowserRADWatchStateOverrideWinsInBothModes(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	workingDir := t.TempDir()
	t.Chdir(workingDir)
	for _, tc := range []struct{ override, want string }{
		{filepath.Join(home, "copy-prod"), filepath.Join(home, "copy-prod")},
		{"~/.browserrad-copy-prod", filepath.Join(home, ".browserrad-copy-prod")},
		{" ./relative-rad ", filepath.Join(workingDir, "relative-rad")},
	} {
		t.Setenv("BROWSERRAD_DIR", tc.override)
		for _, fresh := range []bool{false, true} {
			env, err := buildWatchEnv(proc.Ports{}, "/tmp/profile", true, fresh)
			if err != nil {
				t.Fatal(err)
			}
			var assignments []string
			for _, entry := range env {
				if strings.HasPrefix(entry, "BROWSERRAD_DIR=") {
					assignments = append(assignments, entry)
				}
			}
			if len(assignments) != 1 || assignments[0] != "BROWSERRAD_DIR="+tc.want {
				t.Fatalf("override %q (fresh=%t): state assignments %q", tc.override, fresh, assignments)
			}
		}
	}
}

func TestNewBrowserOSWatchKeepsItsExistingStateRoot(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("BROWSEROS_DIR", "")
	env, err := buildWatchEnv(proc.Ports{}, "/tmp/profile", false, true)
	if err != nil {
		t.Fatal(err)
	}
	if got := envValue(env, "BROWSEROS_DIR"); got != filepath.Join(home, ".browseros-dev") {
		t.Fatalf("unexpected BrowserOS state root: %s", got)
	}
}

func TestBrowserRADWatchDirectoryAliasesShareStateOwnership(t *testing.T) {
	parent := t.TempDir()
	alias := filepath.Join(t.TempDir(), "state-alias")
	if err := os.Symlink(parent, alias); err != nil {
		t.Fatal(err)
	}
	first, err := resolveClawWatchStateLockDir(filepath.Join(alias, "new-state", "nested"))
	if err != nil {
		t.Fatal(err)
	}
	second, err := resolveClawWatchStateLockDir(filepath.Join(parent, "new-state", "nested"))
	if err != nil {
		t.Fatal(err)
	}
	if first != second {
		t.Fatalf("one state directory selected two ownership identities: %s, %s", first, second)
	}
}
