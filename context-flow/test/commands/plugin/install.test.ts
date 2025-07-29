import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('plugin/install', () => {
  it('runs plugin/install cmd', async () => {
    const {stdout} = await runCommand('plugin/install')
    expect(stdout).to.contain('hello world')
  })

  it('runs plugin/install --name oclif', async () => {
    const {stdout} = await runCommand('plugin/install --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
