import { Proposal, NewProposal } from "../models/proposal-model";
import {
  ProposalLineItem,
  NewProposalLineItem,
} from "../models/proposal-line-item-model";

export interface IProposalRepository {
  createProposal(proposal: NewProposal): Promise<Proposal>;
  createProposalLineItems(
    lineItems: NewProposalLineItem[]
  ): Promise<ProposalLineItem[]>;
  getProposalById(id: string): Promise<Proposal | null>;
  getProposalsByRFPId(rfpId: string): Promise<Proposal[]>;
  getAllProposals(): Promise<Proposal[]>;
  getProposalWithLineItems(
    id: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] }) | null>;
  getProposalsByRFPIdWithLineItems(
    rfpId: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]>;
  getAllProposalsWithDetails(): Promise<
    (Proposal & {
      rfp: { id: string; title: string };
      vendor: { id: string; name: string; email: string };
    })[]
  >;
  checkProposalExistsByMessageId(messageId: string): Promise<boolean>;
}

export interface IProposalService {
  getProposalById(
    id: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] }) | null>;
  getProposalsByRFPId(
    rfpId: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]>;
  getAllProposals(): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]>;
}
