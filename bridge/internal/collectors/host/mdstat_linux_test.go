package hostcollector

import (
	"reflect"
	"testing"

	"github.com/prometheus/procfs"
)

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
