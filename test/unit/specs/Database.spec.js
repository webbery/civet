// import Vue from 'vue'
// import LandingPage from '@/components/LandingPage'
const localStorage = require('../../../src/worker/LocalStorage')

describe('image operator', () => {
  it('get all image info', async () => {
    await localStorage.getImagesSnap()
    // console.info(snap)
    // expect(vm.$el.querySelector('.title').textContent).to.contain('Welcome to your new project!')
  })
})

// add image
