import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('serve', () => {
  it('runs serve cmd', async () => {
    const {stdout} = await runCommand('serve')
    expect(true).to.be.true
  })

  it('runs serve --name oclif', async () => {
    const {stdout} = await runCommand('serve --name oclif')
    expect(true).to.be.true
  })
})
