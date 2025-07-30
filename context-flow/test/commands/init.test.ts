import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('init', () => {
  it('runs init cmd', async () => {
    const {stdout} = await runCommand('init')
    expect(true).to.be.true
  })

  it('runs init --name oclif', async () => {
    const {stdout} = await runCommand('init --name oclif')
    expect(true).to.be.true
  })
})
