activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

set :build_dir, 'docs'
activate :directory_indexes

configure :development do
  activate :livereload
end

configure :build do
  set :relative_links, true
  activate :relative_assets
end
