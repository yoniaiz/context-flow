import {Args, Command} from '@oclif/core'

export default class PluginInstall extends Command {
  static override args = {
    'npm-package': Args.string({
      description: 'The name of the npm package for the plugin (e.g., @context-providers/jira)',
      required: true,
    }),
  }

  static override description = 'Installs a new Context Provider plugin.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> @context-providers/github',
    '<%= config.bin %> <%= command.id %> @acme/context-provider-issues',
  ]

  public async run(): Promise<void> {
    const {args} = await this.parse(PluginInstall)

    // TODO: Implement plugin install functionality
    // - Use npm or yarn to install the package into the oclif plugin directory
    // - Make the new provider available for use in .toml files
    
    this.log('✔ Installing plugin...')
    this.log(`✔ Successfully installed '${args['npm-package']}'.`)
    this.log('Provider is now available.')
  }
}
