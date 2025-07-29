import {Command} from '@oclif/core'

export default class PluginList extends Command {
  static override description = 'Lists all installed Context Provider plugins.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    // TODO: Implement plugin list functionality
    // - Show the user which custom providers they have installed
    
    this.log('Installed Context Provider plugins:')
    this.log('No plugins installed.')
  }
}
