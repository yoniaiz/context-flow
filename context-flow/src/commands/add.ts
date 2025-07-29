import {Args, Command} from '@oclif/core'

export default class Add extends Command {
  static override args = {
    'github-url': Args.string({
      description: 'The URL of the Git repository (e.g., github:user/repo-name)',
      required: true,
    }),
  }

  static override description = 'Adds a new component library from a Git repository.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> github:context-js/official-components',
    '<%= config.bin %> <%= command.id %> github:user/my-components',
  ]

  public async run(): Promise<void> {
    const {args} = await this.parse(Add)

    // TODO: Implement add functionality
    // - Clone the specified repository into .context/libs/<repo-name>
    
    this.log(`✔ Cloning library...`)
    this.log(`✔ Added library from ${args['github-url']}.`)
  }
}
