import add from '../lib/index'

describe('add', ()=> {

  it('add', ()=> {

    console.log(add(1,2,3,4))

    expect(add(1,2,3,4)===10).toBe(true)
    expect(add(11,2,33)===46).toBe(true)
    expect(add(11,2,33)===45).toBe(false)

  })

})