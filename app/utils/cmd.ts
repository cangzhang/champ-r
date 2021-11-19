import { promisify } from 'util';
import { exec } from 'child_process';

const runCommand = promisify(exec);

export async function execCmd(command: string) {
  try {
    const { stderr, stdout } = await runCommand(command);
    if (stderr) {
      return Promise.reject(stderr);
    }

    return stdout;
  } catch (error) {
    return Promise.reject(error);
  }
}
