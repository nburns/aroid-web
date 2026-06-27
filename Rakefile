task :run do
  sh "bundle exec middleman server"
end

task :build do
  sh "bundle exec middleman build"
end

task publish: :build do
  print "Commit message: "
  message = $stdin.gets.chomp
  abort "Commit message required." if message.empty?

  sh "git add -A"
  sh %(git commit -m "#{message}")
  sh "git push -u origin main"
end

task default: :run
