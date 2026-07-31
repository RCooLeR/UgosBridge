//go:build linux

package hostcollector

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStableDiskPathIsRelativeToSysFSRoot(t *testing.T) {
	sysFS := filepath.Join(t.TempDir(), "sys")
	target := filepath.Join(sysFS, "devices", "pci0000:00", "0000:00:1d.0", "nvme", "nvme0", "nvme0n1")
	sysBase := filepath.Join(sysFS, "block", "nvme0n1")
	if err := os.MkdirAll(target, 0o755); err != nil {
		t.Fatalf("create target: %v", err)
	}
	if err := os.MkdirAll(sysBase, 0o755); err != nil {
		t.Fatalf("create sys block path: %v", err)
	}
	if err := os.WriteFile(filepath.Join(sysBase, "nsid"), []byte("1\n"), 0o644); err != nil {
		t.Fatalf("write namespace id: %v", err)
	}
	if err := os.Symlink(target, filepath.Join(sysBase, "device")); err != nil {
		t.Fatalf("create device symlink: %v", err)
	}

	got := stableDiskPath(sysBase, sysFS)
	want := "/devices/pci0000:00/0000:00:1d.0/nvme/namespace_1"
	if got != want {
		t.Fatalf("stableDiskPath() = %q, want %q", got, want)
	}
}
