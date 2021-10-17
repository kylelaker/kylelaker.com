---
layout: page
title:  CDC Linux Intro
date:   2018-09-21 15:30:00 -0400
sitemap: false
---

When it comes to competitions, several of the machines the team will be
responsible for will running Linux. Often it's older versions of common of
Linux distros such as Ubuntu 14.04.

## Getting Around

There are very basic commands that will be necessary in order to navigate your
machine.

1. `ls` - Lists the contents of the current directory. To show all files,
use `ls -al`.
1. `pwd` - Shows your current directory
1. `cd` - Changes your current directory. `cd ~`, `cd /`, `cd /etc/`
1. `mkdir` - Makes a new directory `mkdir test`, `mkdir -p a/test/dir`
1. `rm` - Deletes a file (add `-rf` to delete a directory)
1. `find` - Find a file
1. `locate` - Easy way to find a file
1. `touch` - Create an empty file `touch file.txt`
1. `cat` - Print the contents of a file to `stdout`
1. `grep` - Search a file for a string `grep 'string' file.c`
1. `ps` - Shows running processes -- `ps auxf` for tree structure
1. `kill` - Kill a process `kill -9 $PID`
1. `who` - Show who is signed in
1. `echo` - Print to `stdout` -- `echo 'This a test'`
1. `lsof` - See all open file descriptors
1. `tail -f` - Watch the end of a file
1. `watch` - Run a command at specified intervals

## Identifying your box

There are a few ways to find out what distro you're on, the name of the
machine, and the machine's IP address

1. `uname -a` - Prints the kernel version and more
1. `hostname` - Prints the system hostname
1. `ifconfig` - Shows the IP address
1. `ip addr`  - The new way to show IP address
1. `cat /etc/os-release` - Shows various information about the system

## Managing services

There will be certain services that need to be running throughout a
competition. It will be good to know how to manage them. The tool used to
manage services on newer Linux systems is called `systemctl`, part of the
`systemd` suite of utilities.

- `stop` - Stops a service
- `restart` - Restarts a service
- `start` - Starts a service
- `status` - Shows whether a service is running/stopped/failed
- `list-unit` - Shows all services and more
- `reboot` - Reboot the machine

## Ways to be pwned

Once a malicious actor has had root access on your Linux machine, that machine
cannot be trusted. The right thing to do would be to start fresh and be
better at prevention in the future. Unfortunately, that's not possible during
a competition. Here's a few really nasty ways an attacker could mess with you.

- Adding malicious things to `/etc/crontab`. These will run at specified
  intervals (every minute, 5 minutes, every hour at :05, etc.)
- Putting fake binaries on your `$PATH`
  - `sudo` so that anyone who runs `sudo` gets root
  - `passwd` so that you can't change passwords or passwords get logged
- malicious systemd services or timers
- modifications to `~/.*rc` files

## Learning more

- `man` -- try `man man`
- [linuxjourney.com](https://linuxjourney.com) (External link)
- [JMU Unix Users Group](https://www.jmunixusers.org)
- `--help` flag to commands
- `apropos` to search for commands
