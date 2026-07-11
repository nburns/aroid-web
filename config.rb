activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

set :build_dir, 'docs'
activate :directory_indexes

# Apple requires this file at the exact extensionless path
proxy "/.well-known/apple-app-site-association",
      "/.well-known/apple-app-site-association.json",
      ignore: true

configure :development do
  activate :livereload
end

configure :build do
  set :relative_links, true
  activate :relative_assets
end
