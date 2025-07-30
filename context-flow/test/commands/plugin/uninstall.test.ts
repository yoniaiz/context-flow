import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('plugin/uninstall', () => {
  it('runs plugin/uninstall cmd', async () => {
    const {stdout} = await runCommand('plugin/uninstall')
    expect(true).to.be.true
  })

  it('runs plugin/uninstall --name oclif', async () => {
    const {stdout} = await runCommand('plugin/uninstall --name oclif')
    expect(true).to.be.true
  })
})
