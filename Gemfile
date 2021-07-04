# frozen_string_literal: true

source "https://rubygems.org"

git_source(:github) {|repo_name| "https://github.com/#{repo_name}" }

# gem "rails"
gem "jekyll"

# Jekyll seems to not yet be compatible with the new version of execjs
# https://talk.jekyllrb.com/t/jekyll-serve-fails-with-trace-mentioning-execjs/6145
gem 'execjs', '<2.8.0'

group :jekyll_plugins do
    gem 'jekyll-sitemap'
    gem 'jekyll-seo-tag'
    gem 'jekyll-autoprefixer'
    gem 'jekyll-paginate'
end
