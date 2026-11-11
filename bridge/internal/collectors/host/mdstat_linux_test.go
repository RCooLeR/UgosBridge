package hostcollector

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/prometheus/procfs"
)

func TestReadMDStatWithoutMDDriver(t *testing.T) {
	root := t.TempDir()
	proc, err := procfs.NewFS(root)
	if err != nil {
		t.Fatal(err)
	}

	arrays, err := readMDStat(proc)
	if err != nil || arrays != nil {
		t.Fatalf("readMDStat without /proc/mdstat = %#v, %v; want no arrays and no error", arrays, err)
	}

	mdstat := `Personalities : [raid1]
md0 : active raid1 sdb1[1] sda1[0]
      1046528 blocks super 1.2 [2/2] [UU]

unused devices: <none>
`
	if err := os.WriteFile(filepath.Join(root, "mdstat"), []byte(mdstat), 0o644); err != nil {
		t.Fatal(err)
	}
	arrays, err = readMDStat(proc)
	if err != nil || len(arrays) != 1 || arrays[0].Name != "md0" {
		t.Fatalf("readMDStat = %#v, %v; want md0", arrays, err)
	}
}

func TestMDStatDeviceNames(t *testing.T) {
	components := []procfs.MDStatComponent{
		{Name: "sda1"},
		{Name: "sdb1", Spare: true},
	}

	got := mdStatDeviceNames(components)
	want := []string{"sda1", "sdb1"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("mdStatDeviceNames() = %#v, want %#v", got, want)
	}
}
