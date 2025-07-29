import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('pull', () => {
  it('runs pull cmd', async () => {
    const {stdout} = await runCommand('pull')
    expect(stdout).to.contain('hello world')
  })

  it('runs pull --name oclif', async () => {
    const {stdout} = await runCommand('pull --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
