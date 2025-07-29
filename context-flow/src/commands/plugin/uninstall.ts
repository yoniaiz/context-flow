import {Args, Command} from '@oclif/core'

export default class PluginUninstall extends Command {
  static override args = {
    'npm-package': Args.string({
      description: 'The name of the npm package to uninstall',
      required: true,
    }),
  }

  static override description = 'Uninstalls a Context Provider plugin.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> @context-providers/github',
    '<%= config.bin %> <%= command.id %> @acme/context-provider-issues',
  ]

  public async run(): Promise<void> {
    const {args} = await this.parse(PluginUninstall)

    // TODO: Implement plugin uninstall functionality
    // - Remove the previously installed plugin
    
    this.log(`✔ Uninstalled '${args['npm-package']}'.`)
  }
}
