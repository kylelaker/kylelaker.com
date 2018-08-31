---
layout: splash
title: Projects
permalink: /projects/
header:
  overlay_color: #FFF
  overlay_filter: 0.5
  overlay_image: "#"
  cta_label: "See on GitHub"
  cta_url: "https://github.com/kylelaker"
excerpt: "Below is a selection of projects from my GitHub profile. Pull requests are always welcome on any project. Additionally, I am a contributor to several projects that are hosted by the JMU Unix Users Group."
feature_row:
  - title: "Useful Scripts"
    excerpt: " A collection of scripts for simplifying some actions. Includes a script for configuring the JMU LabPrint printers, a script for calculating the hash of files using different functions, a dynamic MOTD for a server (or potentially client), and more."
    url: "https://github.com/kylelaker/useful_scripts"
    btn_label: "View project »"
    btn_class: "btn--primary"
  - title: "Dotfiles (with Ansible)"
    excerpt: " I switch Linux distros fairly often and bork my home directory even more frequently. Keeping my dotfiles in source control assists in making sure that I can dig myself out some holes a little more quickly. Contains my i3 configuration as well. I have recently started using Ansible to deploy my dotfiles."
    url: "https://github.com/kylelaker/dotfiles-ansible"
    btn_label: "View project »"
    btn_class: "btn--primary"
  - title: "xorlist"
    excerpt: "An implementation of an xorlist (doubly linked list with xor'ed pointers to adjacent elements) in C"
    url: "https://github.com/kylelaker/xorlist"
    btn_label: "View project »"
    btn_class: "btn--primary"
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}
