type electronUtilIs = {
  development: bool,
}

@bs.module("electron-util") external is: electronUtilIs = "is"
@bs.module("electron-log") external functions: 'a = "functions"
@bs.val external console: 'a = "console"

if is.development {
  let _ = Js.Obj.assign(console, functions)
}
