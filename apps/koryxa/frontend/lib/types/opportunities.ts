export type Opportunity = {
  id: string;
  title: string;
  problem?: string;
  status: string;
  country?: string;
  skills_required?: string[];
  tags?: string[];
  created_at?: string;
  mission_id?: string;
  source?: string;
  product_slug?: string;
};

export type OpportunityListResponse = {
  items: Opportunity[];
  total: number;
  has_more?: boolean;
};
