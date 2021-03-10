type electronUtilIs = {development: bool}

@module("electron-util") external is: electronUtilIs = "is"
@module("electron-log") external functions: 'a = "functions"
@val external console: 'a = "console"

if is.development {
  let _ = Js.Obj.assign(console, functions)
}
