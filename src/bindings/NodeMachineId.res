module NodeMachineId = {
  @module("node-machine-id") external machineId: unit => Js.Promise.t<string> = "machineId"
}
