/** 星星银行兑换记录 */
export type StarBankRedemption = {
  id: string;
  createdAt: string;
  /** 兑换金额（元） */
  yuan: number;
  /** 消耗的星星数 */
  starsSpent: number;
};

export type StarBankAccount = {
  redemptions: StarBankRedemption[];
  /** 累计已兑换金额（元） */
  totalRedeemedYuan: number;
  /** 累计已消耗星星 */
  totalRedeemedStars: number;
  updatedAt: string;
};

export type StarBankRedeemResult =
  | {
      ok: true;
      redemption: StarBankRedemption;
      starsRemaining: number;
    }
  | {
      ok: false;
      error: string;
    };
