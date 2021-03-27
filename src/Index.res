%%raw("require('./index.scss')")

open AppLogger
open AppI18n

AppLogger.init()
AppI18n.init()

switch ReactDOM.querySelector("#root") {
  | Some(root) => ReactDOM.render(<div>{"root"->React.string}</div>, root)
  | None => ()
}