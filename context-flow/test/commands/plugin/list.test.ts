import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('plugin/list', () => {
  it('runs plugin/list cmd', async () => {
    const {stdout} = await runCommand('plugin/list')
    expect(stdout).to.contain('hello world')
  })

  it('runs plugin/list --name oclif', async () => {
    const {stdout} = await runCommand('plugin/list --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
