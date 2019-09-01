---
layout: single
title:  "Timing Boot with systemd"
date:   2017-05-30 00:00:00 -0400
---

> Warning! This is a documentation of my experience, not a walkthrough. The
> steps listed here may not work for you and your system is probably configured
> differently. If you want to make the same changes, read the relevant wiki
> page.

Being an Arch Linux user pretty much means that for better for worse, I am
stuck using systemd as my init system, whether I like it or not. And in
general, it seems that Arch is all aboard the systemd train. Generally new
versions hit the official repos relatively quickly (still waiting for 233,
though), and the wiki has a ton of great systemd resources. systemd-nspawn is
the preferred way to launch a container. In general, it feels like any problem
you mention, the solution is given with systemd.

## mkinitcpio hooks

A notable place where Arch has not yet embraced systemd by default is in the
initramfs. The default configuration uses busybox, and includes the individual
`udev`, `usr`, and `resume` hooks instead of the `systemd` hook, as well as
`keymap` and `console` instead of `systemd-vconsole`, and similar for `encrypt`
and `lvm`. There may be technical reasons for why the default configuration has
not changed, but I have not run into any issues switching to the systemd
versions of the hooks and I haven't looked into to the reasons for Arch not
switching.

Personally, my motivation to switch was driven by a desire for more detailed
profiling in the `systemd-analyze` tool. If booting a system without
systemd-boot or the systemd hooks, `systemd-analyze` will show you two
categories: kernel and user. Kernel will include the time for the kernel as
well as the initrd. Using the systemd initramfs hooks adds a specific entry for
the initrd.

Switching to the systemd hooks isn't particularly painful, but you will want to
do three things before doing so. The first is make a backup of
`/boot/initramfs-linux-fallback.img`. Copy it to to something like
`/boot/initramfs-linux-fallback-backup.img`. Second, whatever bootloader you
use, whether it's rEFInd, systemd-boot, or GRUB, make sure that you have it
configured to allow you to modify boot entries and know how to get to that
point. And finally, copy `/etc/mkinitcpio.conf` to `/etc/mkinitcpio.bak`.

One important thing I didn't realize that I wish I had was that the `base` hook
provides a busybox recovery shell. This would have been useful as I was
troubleshooting, but at this point I only add it in if I will be modifying my
mkinitcpio configs or the kernel.

I then went into `/etc/mkinitcpio.conf` and was able to slim

```
HOOKS="base udev autodetect modconf block filesystems keyboard consolefont
fsck"
```

All the way down to

```
HOOKS="systemd autodetect modconf block filesystems"
```

While I was there, I also switched the compression algorithm to LZ4.Then I ran

```
# mkinitcpio -p linux
```

and rebooted. And I had kernel, initrd, and user sections in my systemd-analyze
output. I really wanted to go further, though.

## systemd-boot

While there are more beautiful EFI bootloaders like rEFInd or older ones like
GRUB, I have come to really like using systemd-boot. The configuration is easy
to adjust, it automatically detects Windows and macOS and can boot those, and
it adds two more sections to the `systemd-analyze` output: firmware and loader

Switching to systemd-boot actually took some work because previously, I had
used my EFI System Partition (esp) solely for EFI programs and tools with
kernels and my initramfs located in `/boot` on my rootfs. To make the change, I
copied all non-rEFInd things in /boot to `/boot/EFI`, where my esp was mounted.
Then I unmounted the esp, removed everything in /boot, and mounted the esp to
boot (while also updating my fstab). I found all rEFInd-related things on the
esp and removed those and then used `bootctl` to install systemd-boot to
`/boot`.

At this point, I had to configure systemd-boot, which proved to be a lot easier
than I expected. In `/boot/loader/loader.conf` I set my default boot option,
and set timeout and editor to 0. Then in `/boot/loader/entries/` I made an
entry for each Linux kernel I wanted to use, added an extra initrd line for the
Intel Microcode updates, and added my options.

After a reboot, my system came up happily. Now I have all the information from
`systemd-analyze` that I could ever want.

```
Startup finished in 4.322s (firmware) + 57ms (loader) + 995ms (kernel) + 875ms
(initrd) + 1.802s (userspace) = 8.053s
```
