declare namespace mws {
    export type DateTime = string;
    // https://docs.developer.amazonservices.com/en_UK/easy_ship/EasyShip_Datatypes.html
    export type Dimensions = {
        Length: number;
        Width: number;
        Height: number;
        Unit: 'cm';
        Name?: string;
    };
    export type InvoiceData = {
        InvoiceNumber: string;
        InvoiceDate?: DateTime;
    };
    export type Item = {
        OrderItemId: string;
        OrderItemSerialNumberList: string;
    };
    export type ScheduledPackageId = {
        AmazonOrderId: string;
        PackageId?: string;
    };
    export type Weight = {
        Value: number;
        Unit: 'g';
    };
    export type PickupSlot = {
        SlotId: string;
        PickupTimeStart?: string;
        PickupTimeEnd?: string;
    };
    export type Package = {
        ScheduledPackageId: ScheduledPackageId;
        PackageDimensions: Dimensions;
        PackageWeight: Weight;
        PackageItemsList?: Array<Item>;
        PackagePickupSlot: PickupSlot;
        PackageIdentifier?: string;
        Invoice?: InvoiceData;
        PackageStatus?: 'Unscheduled' | 'Scheduled';
    };
    export type PackageRequestDetails = {
        PackageDimensions?: Dimensions;
        PackageWeight?: Weight;
        PackageItemList?: Array<Item>;
        PackagePickupSlot: PickupSlot;
        PackageIdentifier?: string;
    };
    export type ScheduledPackageUpdateDetails = {
        ScheduledPackageId: ScheduledPackageId;
        PackagePickupSlot: PickupSlot;
    };
    // https://docs.developer.amazonservices.com/en_UK/feeds/Feeds_Datatypes.html
    export type FeedSubmissionInfo = {
        FeedSubmissionId: string;
        FeedType: string;
        SubmittedDate: DateTime;
        FeedProcessingStatus: string;
        StartedProcessingDate: DateTime;
        CompletedProcessingDate: DateTime;
    };
    // https://docs.developer.amazonservices.com/en_UK/finances/Finances_Datatypes.html
    export type CurrencyAmount = {
        CurrencyCode?: string;
        CurrencyAmount?: number;
    };
    export type AdjustmentItem = {
        Quantity?: string;
        PerUnitAmount?: CurrencyAmount;
        TotalAmount?: CurrencyAmount;
        SellerSKU?: string;
        FnSKU?: string;
        ProductDescription?: string;
        ASIN?: string;
    };
    export type AdjustmentEvent = {
        AdjustmentType:
            | 'FBAInventoryReimbursement'
            | 'ReserveEvent'
            | 'PostageBilling'
            | 'PostageRefund'
            | 'LostOrDamagedReimbursement'
            | 'CanceledButPickedUpReimbursement'
            | 'ReimbursementClawback'
            | 'SellerRewards';
        AdjustmentAmount: CurrencyAmount;
        AdjustmentItemList: Array<AdjustmentItem>;
        PostedDate: DateTime;
    };
    export type AffordabilityExpenseEvent = {
        /* cSpell: disable */
        PostedDate?: DateTime;
        TransactionType?: 'Charge' | 'Refund';
        AmazonOrderId?: string;
        BaseExpense?: CurrencyAmount;
        TotalExpense?: CurrencyAmount;
        TaxTypeIGST?: CurrencyAmount;
        TaxTypeCGST?: CurrencyAmount;
        TaxTypeSGST?: CurrencyAmount;
        MarketplaceId?: string;
        /* cSpell: enable */
    };
    export type AffordabilityExpenseReversalEvent = AffordabilityExpenseEvent;
    export type ChargeComponent = {
        ChargeType?:
            | 'Principal'
            | 'Tax'
            | 'MarketplaceFacilitatorTax-Principal'
            | 'MarketplaceFacilitatorTax-Shipping'
            | 'MarketplaceFacilitatorTax-Giftwrap'
            | 'MarketplaceFacilitatorTax-Other'
            | 'Discount'
            | 'TaxDiscount'
            | 'CODItemCharge'
            | 'CODItemTaxCharge'
            | 'CODOrderCharge'
            | 'CODOrderTaxCharge'
            | 'CODShippingCharge'
            | 'CODShippingTaxCharge'
            | 'ShippingCharge'
            | 'ShippingTax'
            | 'Goodwill'
            | 'Giftwrap'
            | 'GiftwrapTax'
            | 'RestockingFee'
            | 'ReturnShipping'
            | 'PointsFee'
            | 'GenericDeduction'
            | 'FreeReplacementReturnShipping'
            | 'PaymentMethodFee'
            | 'ExportCharge'
            | 'SAFE-TReimbursement'
            | 'TCS-CGST'
            | 'TCS-SGST'
            | 'TCS-IGST'
            | 'TCS-UTGST';
        ChargeAmount?: CurrencyAmount;
    };
    export type ChargeInstrument = {
        Description?: string;
        Tail?: string;
        Amount?: CurrencyAmount;
    };
    export type CouponPaymentEvent = {
        PostedDate?: DateTime;
        CouponId?: string;
        SellerCouponDescription?: string;
        ClipOrRedemptionCount?: number;
        PaymentEventId?: string;
        FeeComponent?: FeeComponent;
        ChargeComponent?: ChargeComponent;
        TotalAmount?: CurrencyAmount;
    };
    export type DebtRecoveryEvent = {
        DebtRecoveryType?: 'DebtPayment' | 'DebtPaymentFailure' | 'DebtAdjustment';
        RecoveryAmount?: CurrencyAmount;
        OverPaymentCredit?: CurrencyAmount;
        DebtRecoveryItemList?: Array<DebtRecoveryItem>;
        ChargeInstrumentList?: Array<ChargeInstrument>;
    };
    export type DebtRecoveryItem = {
        RecoveryAmount?: CurrencyAmount;
        OriginalAmount?: CurrencyAmount;
        GroupBeginDate?: DateTime;
        GroupEndDate?: DateTime;
    };
    export type DirectPayment = {
        DirectPaymentType?:
            | 'StoredValueCardRevenue'
            | 'StoredValueCardRefund'
            | 'PrivateLabelCreditCardRevenue'
            | 'PrivateLabelCreditCardRefund'
            | 'CollectOnDeliveryRevenue'
            | 'CollectOnDeliveryRefund';
        DirectPaymentAmount?: CurrencyAmount;
    };
    export type FBALiquidationEvent = {
        PostedDate?: DateTime;
        OriginalRemovalOrderId?: string;
        LiquidationProceedsAmount?: CurrencyAmount;
        LiquidationFeeAmount?: CurrencyAmount;
    };
    export type FeeComponent = {
        FeeType?: string; // TODO: https://docs.developer.amazonservices.com/en_UK/finances/Finances_FeeTypes.html lists values
        FeeAmount?: CurrencyAmount;
    };
    export type FinancialEventGroup = {
        FinancialEventGroupId?: string;
        ProcessingStatus?: 'Open' | 'Closed';
        FundTransferStatus?: string;
        OriginalTotal?: CurrencyAmount;
        ConvertedTotal?: CurrencyAmount;
        FundTransferDate?: DateTime;
        TraceId?: string;
        AccountTail?: string;
        BeginningBalance?: CurrencyAmount;
        FinancialEventGroupStart?: DateTime;
        FinancialEventGroupEnd?: DateTime;
    };
    // TODO continue, from https://docs.developer.amazonservices.com/en_UK/finances/Finances_Datatypes.html#AffordabilityExpenseReversalEvent
    // export type FinancialEvents = {
    //     ShipmentEventList?: Array<ShipmentEvent>;
    //     RefundEventList?: Array<ShipmentEvent>;
    //     GuaranteeClaimEventList?: Array<ShipmentEvent>;
    //     ChargebackEventList?: Array<ShipmentEvent>;
    //     PayWithAmazonEventList?: Array<PayWithAmazonEvent>;
    //     ServiceProviderCreditEventList?: Array<SolutionProviderCreditEvent>;
    //     RetrochargeEventList?: Array<RetrochargeEvent>;
    // }
}