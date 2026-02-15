import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorQuadraticVotingQ126 } from "../target/types/anchor_quadratic_voting_q1_26";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { assert, expect } from "chai";

describe("anchor-quadratic-voting-q1-26", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorQuadraticVotingQ126 as Program<AnchorQuadraticVotingQ126>;

  const creator = Keypair.generate();
  const voter1 = Keypair.generate();
  const voter2 = Keypair.generate();

  let mint: PublicKey;
  let voter1TokenAccount: PublicKey;
  let voter2TokenAccount: PublicKey;

  let daoAccount: PublicKey;
  let proposalAccount: PublicKey;

  const daoName = "Test DAO";
  const proposalMetadata = "Should we implement feature X?";

  before(async () => {
    await provider.connection.requestAirdrop(creator.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voter1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voter2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    mint = await createMint(
      provider.connection,
      creator,
      creator.publicKey,
      null,
      6
    );

    voter1TokenAccount = await createAccount(
      provider.connection,
      voter1,
      mint,
      voter1.publicKey
    );

    voter2TokenAccount = await createAccount(
      provider.connection,
      voter2,
      mint,
      voter2.publicKey
    );

    await mintTo(
      provider.connection,
      creator,
      mint,
      voter1TokenAccount,
      creator.publicKey,
      100_000000
    );

    await mintTo(
      provider.connection,
      creator,
      mint,
      voter2TokenAccount,
      creator.publicKey,
      64_000000
    );
  });

  describe("Initialize DAO", () => {
    it("Initializes a DAO", async () => {
      [daoAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), creator.publicKey.toBuffer(), Buffer.from(daoName)],
        program.programId
      );

      await program.methods
        .initDao(daoName)
        .accountsStrict({
          creator: creator.publicKey,
          daoAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const dao = await program.account.dao.fetch(daoAccount);
      expect(dao.name).to.equal(daoName);
      expect(dao.authority.toBase58()).to.equal(creator.publicKey.toBase58());
      expect(dao.proposalCount.toNumber()).to.equal(0);
    });
  });

  describe("Create Proposal", () => {
    it("Creates a proposal", async () => {
      [proposalAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          daoAccount.toBuffer(),
          Buffer.from(new Uint8Array(new BigUint64Array([BigInt(0)]).buffer))
        ],
        program.programId
      );

      const daoBefore = await program.account.dao.fetch(daoAccount);
      expect(daoBefore.proposalCount.toNumber()).to.equal(0);

      await program.methods
        .initProposal(proposalMetadata)
        .accountsStrict({
          creator: creator.publicKey,
          daoAccount,
          proposal: proposalAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalAccount);
      expect(proposal.metadata).to.equal(proposalMetadata);
      expect(proposal.authority.toBase58()).to.equal(creator.publicKey.toBase58());
      expect(proposal.yesVoteCount.toNumber()).to.equal(0);
      expect(proposal.noVoteCount.toNumber()).to.equal(0);

      const daoAfter = await program.account.dao.fetch(daoAccount);
      expect(daoAfter.proposalCount.toNumber()).to.equal(1);
    });
  });

  describe("Cast Votes", () => {
    it("Casts a YES vote with quadratic voting", async () => {
      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          voter1.publicKey.toBuffer(),
          proposalAccount.toBuffer()
        ],
        program.programId
      );

      const proposalBefore = await program.account.proposal.fetch(proposalAccount);
      expect(proposalBefore.yesVoteCount.toNumber()).to.equal(0);
      expect(proposalBefore.noVoteCount.toNumber()).to.equal(0);

      await program.methods
        .castVote(1)
        .accountsStrict({
          voter: voter1.publicKey,
          daoAccount,
          proposal: proposalAccount,
          voteAccount,
          voterTokenAccount: voter1TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      const vote = await program.account.vote.fetch(voteAccount);
      expect(vote.authority.toBase58()).to.equal(voter1.publicKey.toBase58());
      expect(vote.voteType).to.equal(1);

      const expectedCredits = Math.floor(Math.sqrt(100_000000));
      expect(vote.voteCredits.toNumber()).to.equal(expectedCredits);

      const proposalAfter = await program.account.proposal.fetch(proposalAccount);
      expect(proposalAfter.yesVoteCount.toNumber()).to.equal(expectedCredits);
      expect(proposalAfter.noVoteCount.toNumber()).to.equal(0);
    });

    it("Casts a NO vote with quadratic voting", async () => {
      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          voter2.publicKey.toBuffer(),
          proposalAccount.toBuffer()
        ],
        program.programId
      );

      const voter1Credits = Math.floor(Math.sqrt(100_000000));
      const proposalBefore = await program.account.proposal.fetch(proposalAccount);
      expect(proposalBefore.yesVoteCount.toNumber()).to.equal(voter1Credits);
      expect(proposalBefore.noVoteCount.toNumber()).to.equal(0);

      await program.methods
        .castVote(0)
        .accountsStrict({
          voter: voter2.publicKey,
          daoAccount,
          proposal: proposalAccount,
          voteAccount,
          voterTokenAccount: voter2TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      const vote = await program.account.vote.fetch(voteAccount);
      expect(vote.authority.toBase58()).to.equal(voter2.publicKey.toBase58());
      expect(vote.voteType).to.equal(0);

      const expectedCredits = Math.floor(Math.sqrt(64_000000));
      expect(vote.voteCredits.toNumber()).to.equal(expectedCredits);

      const proposalAfter = await program.account.proposal.fetch(proposalAccount);
      expect(proposalAfter.yesVoteCount.toNumber()).to.equal(voter1Credits);
      expect(proposalAfter.noVoteCount.toNumber()).to.equal(expectedCredits);
    });
  });

  describe("Security Tests", () => {
    it("Prevents double voting", async () => {
      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          voter1.publicKey.toBuffer(),
          proposalAccount.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .castVote(0)
          .accountsStrict({
            voter: voter1.publicKey,
            daoAccount,
            proposal: proposalAccount,
            voteAccount,
            voterTokenAccount: voter1TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter1])
          .rpc();

        assert.fail("Should have failed - double voting not allowed");
      } catch (error) {
        expect(error.toString()).to.include("already in use");
      }
    });

    it("Prevents voting with invalid vote type", async () => {
      const voter3 = Keypair.generate();
      await provider.connection.requestAirdrop(voter3.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const voter3TokenAccount = await createAccount(
        provider.connection,
        voter3,
        mint,
        voter3.publicKey
      );

      await mintTo(
        provider.connection,
        creator,
        mint,
        voter3TokenAccount,
        creator.publicKey,
        25_000000
      );

      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          voter3.publicKey.toBuffer(),
          proposalAccount.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .castVote(2)
          .accountsStrict({
            voter: voter3.publicKey,
            daoAccount,
            proposal: proposalAccount,
            voteAccount,
            voterTokenAccount: voter3TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter3])
          .rpc();

        assert.fail("Should have failed - invalid vote type");
      } catch (error) {
        expect(error.message).to.include("InvalidVoteType");
      }
    });

    it("Prevents voting with someone else's token account", async () => {
      const voter4 = Keypair.generate();
      await provider.connection.requestAirdrop(voter4.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          voter4.publicKey.toBuffer(),
          proposalAccount.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .castVote(1)
          .accountsStrict({
            voter: voter4.publicKey,
            daoAccount,
            proposal: proposalAccount,
            voteAccount,
            voterTokenAccount: voter1TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter4])
          .rpc();

        assert.fail("Should have failed - cannot use someone else's token account");
      } catch (error) {
        expect(error.message).to.include("InvalidTokenAccount");
      }
    });
  });
});
