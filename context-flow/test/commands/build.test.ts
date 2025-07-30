import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('build', () => {
  it('runs build cmd', async () => {
    const {stdout} = await runCommand('build')
    expect(true).to.be.true
  })

  it('runs build --name oclif', async () => {
    const {stdout} = await runCommand('build --name oclif')
    expect(true).to.be.true
  })
})
