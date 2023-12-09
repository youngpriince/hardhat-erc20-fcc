const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
  developmentChains,
  INITIAL_SUPPLY,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("SampleToken Unit Test", function () {
      //Multipler is used to make reading the math easier because of the 18 decimal points
      const multiplier = 10 ** 18
      let sampleToken, deployer, user1
      beforeEach(async function () {
        const accounts = await getNamedAccounts()
        deployer = accounts.deployer
        user1 = accounts.user1

        await deployments.fixture("all")
        sampleToken = await ethers.getContract("SampleToken", deployer)
      })
      it("was deployed", async () => {
        assert(sampleToken.address)
      })
      describe("constructor", () => {
        it("Should have correct INITIAL_SUPPLY of token ", async () => {
          const totalSupply = await sampleToken.totalSupply()
          assert.equal(totalSupply.toString(), INITIAL_SUPPLY)
        })
        it("initializes the token with the correct name and symbol ", async () => {
          const name = (await sampleToken.name()).toString()
          assert.equal(name, "SampleToken")

          const symbol = (await sampleToken.symbol()).toString()
          assert.equal(symbol, "ST")
        })
      })
      describe("transfers", () => {
        it("Should be able to transfer tokens successfully to an address", async () => {
          const tokensToSend = ethers.utils.parseEther("10")
          await sampleToken.transfer(user1, tokensToSend)
          expect(await sampleToken.balanceOf(user1)).to.equal(tokensToSend)
        })
        it("emits an transfer event, when an transfer occurs", async () => {
          await expect(
            sampleToken.transfer(user1, (10 * multiplier).toString())
          ).to.emit(sampleToken, "Transfer")
        })
      })
      describe("allowances", () => {
        const amount = (20 * multiplier).toString()
        beforeEach(async () => {
          playerToken = await ethers.getContract("SampleToken", user1)
        })
        it("Should approve other address to spend token", async () => {
          const tokensToSpend = ethers.utils.parseEther("5")
          //Deployer is approving that user1 can spend 5 of their precious ST's
          await sampleToken.approve(user1, tokensToSpend)
          await playerToken.transferFrom(deployer, user1, tokensToSpend)
          expect(await playerToken.balanceOf(user1)).to.equal(tokensToSpend)
        })
        it("doesn't allow an unnaproved member to do transfers", async () => {
          await expect(
            playerToken.transferFrom(deployer, user1, amount)
          ).to.be.revertedWith("ERC20: insufficient allowance")
        })
        it("emits an approval event, when an approval occurs", async () => {
          await expect(sampleToken.approve(user1, amount)).to.emit(
            sampleToken,
            "Approval"
          )
        })
        it("the allowance being set is accurate", async () => {
          await sampleToken.approve(user1, amount)
          const allowance = await sampleToken.allowance(deployer, user1)
          assert.equal(allowance.toString(), amount)
        })
        it("won't allow a user to go over the allowance", async () => {
          await sampleToken.approve(user1, amount)
          await expect(
            playerToken.transferFrom(
              deployer,
              user1,
              (40 * multiplier).toString()
            )
          ).to.be.revertedWith("ERC20: insufficient allowance")
        })
      })
    })
