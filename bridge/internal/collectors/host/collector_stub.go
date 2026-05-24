//go:build !linux

package hostcollector

import (
	"context"
	"fmt"
	"time"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

type FilesystemMount struct {
	Name          string
	ContainerPath string
}

type Config struct {
	ProcFS                   string
	SysFS                    string
	HostnamePath             string
	HostnameOverride         string
	Filesystems              []FilesystemMount
	NetworkInclude           []string
	DRIPath                  string
	TemperatureAverageWindow time.Duration
	UPSEnabled               bool
	UPSCommand               string
	UPSTargets               []string
	UPSTimeout               time.Duration
	IntelGPUTopEnabled       bool
	IntelGPUTopPath          string
	IntelGPUTopDevice        string
	IntelGPUTopPeriod        time.Duration
	VMsEnabled               bool
	VirshPath                string
	VirshURI                 string
	VirshTimeout             time.Duration
	VMNameOverrides          map[string]string
}

type Collector struct{}

func New(Config) (*Collector, error) {
	return &Collector{}, nil
}

func (c *Collector) Collect(context.Context) (model.HostSnapshot, error) {
	return model.HostSnapshot{}, fmt.Errorf("host metrics are only supported on linux")
}
