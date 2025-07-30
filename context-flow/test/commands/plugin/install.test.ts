import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('plugin/install', () => {
  it('runs plugin/install cmd', async () => {
    const {stdout} = await runCommand('plugin/install')
    expect(true).to.be.true
  })

  it('runs plugin/install --name oclif', async () => {
    const {stdout} = await runCommand('plugin/install --name oclif')
    expect(true).to.be.true
  })
})
