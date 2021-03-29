module Node = {
  @val external module_: 'a = "module"
  @val external __dirname: string = "__dirname"
  @module("path") external join: (string, string) => string = "join"
  @val external resourcesPath: string = "process.resourcesPath"
}
