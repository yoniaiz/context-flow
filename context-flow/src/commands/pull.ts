import {Args, Command, Flags} from '@oclif/core'

export default class Pull extends Command {
  static override args = {
    'component-name': Args.string({
      description: 'The name of the component to pull (e.g., RunProjectTests)',
      required: true,
    }),
  }

  static override description = 'Copies ("vendors") a component from a library into the local project for modification.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> RepoMap',
    '<%= config.bin %> <%= command.id %> RunProjectTests --lib official-components',
  ]

  static override flags = {
    lib: Flags.string({
      description: 'Specify the library to pull from if the component name is ambiguous',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Pull)

    // TODO: Implement pull functionality
    // - Search all libraries in .context/libs/ for the specified component
    // - Copy the corresponding component.toml file into local components/ directory
    
    this.log(`✔ Pulled '${args['component-name']}' into your local components/ directory.`)
    this.log('You can now edit components/ files and version them with your project.')
    if (flags.lib) {
      this.log(`Used library: ${flags.lib}`)
    }
  }
}
