alias w := watch
alias r := run

watch:
  cargo watch -x "run -p app"
run:
  cargo run -p app
