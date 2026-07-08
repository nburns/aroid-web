task :run do
  vite_pid = spawn("npm run dev", chdir: "share")
  sh "bundle exec middleman server"
ensure
  Process.kill("TERM", vite_pid) rescue nil
  Process.wait(vite_pid) rescue nil
end

task :build do
  sh "cd share && npm run build"
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
