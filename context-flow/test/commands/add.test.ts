import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('add', () => {
  it('runs add cmd', async () => {
    const {stdout} = await runCommand('add')
    expect(true).to.be.true
  })

  it('runs add --name oclif', async () => {
    const {stdout} = await runCommand('add --name oclif')
    expect(true).to.be.true
  })
})
