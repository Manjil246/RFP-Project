import {
  IProposalRepository,
  IProposalService,
} from "../interfaces/proposal.interfaces";
import { ProposalLineItem } from "../models/proposal-line-item-model";
import { Proposal } from "../models/proposal-model";

export class ProposalService implements IProposalService {
  private proposalRepository: IProposalRepository;

  constructor(proposalRepository: IProposalRepository) {
    this.proposalRepository = proposalRepository;
  }

  async getProposalById(
    id: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] }) | null> {
    return await this.proposalRepository.getProposalWithLineItems(id);
  }

  async getProposalsByRFPId(
    rfpId: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]> {
    return await this.proposalRepository.getProposalsByRFPIdWithLineItems(
      rfpId
    );
  }

  async getAllProposals(): Promise<
    (Proposal & {
      lineItems: ProposalLineItem[];
      rfp?: { id: string; title: string };
      vendor?: { id: string; name: string; email: string };
    })[]
  > {
    // Get proposals with RFP and Vendor details
    const allProposalsWithDetails =
      await this.proposalRepository.getAllProposalsWithDetails();

    // Add line items to each proposal
    const proposalsWithItems = await Promise.all(
      allProposalsWithDetails.map(
        async (proposal: (typeof allProposalsWithDetails)[0]) => {
          const proposalWithItems =
            await this.proposalRepository.getProposalWithLineItems(proposal.id);
          return {
            ...proposal,
            lineItems: proposalWithItems?.lineItems || [],
          };
        }
      )
    );

    return proposalsWithItems;
  }
}
