/**
 * ============================================================
 * MONGODB ATLAS INITIALIZATION SCRIPT
 * Ứng dụng: Kế hoạch tiết kiệm 1–300 ngày + QR payOS
 * Database: saving_100_app
 * ============================================================
 *
 * Câu lệnh chạy trên CMD:
 *
 * mongosh "mongodb+srv://saving-100-cluster.azxkyv4.mongodb.net/" --username saving_app_user --file "C:\Users\LENOVO\Downloads\init-saving-100-app.js"
 *
 * Script tạo:
 *
 * 1. users
 * 2. saving_challenges
 * 3. saving_checkins
 * 4. saving_plans
 * 5. saving_slots
 * 6. saving_payments
 * 7. challenge_payments
 * 8. saving_day_records
 * 9. payos_webhook_events
 * 10. saving_events
 * 11. counters
 *
 * Có thể chạy lại script:
 * - Collection đã tồn tại: cập nhật validator.
 * - Index cùng tên đã tồn tại: bỏ qua.
 * - Counter đã tồn tại: không reset số.
 */

const DB_NAME = "saving_100_app";

db = db.getSiblingDB(DB_NAME);

print("");
print("============================================================");
print("BẮT ĐẦU KHỞI TẠO DATABASE: " + DB_NAME);
print("============================================================");
print("");


/* ============================================================
 * HÀM DÙNG CHUNG
 * ============================================================ */

/**
 * Kiểm tra collection đã tồn tại hay chưa.
 */
function collectionExists(collectionName) {
    return db.getCollectionNames().includes(collectionName);
}


/**
 * Tạo collection mới hoặc cập nhật validator nếu collection
 * đã tồn tại.
 */
function createOrUpdateCollection(collectionName, validator) {
    if (!collectionExists(collectionName)) {
        db.createCollection(collectionName, {
            validator: validator,
            validationLevel: "strict",
            validationAction: "error"
        });

        print("[CREATE COLLECTION] " + collectionName);
        return;
    }

    const result = db.runCommand({
        collMod: collectionName,
        validator: validator,
        validationLevel: "strict",
        validationAction: "error"
    });

    if (!result.ok) {
        throw new Error(
            "Không thể cập nhật validator cho collection: "
            + collectionName
        );
    }

    print("[UPDATE VALIDATOR] " + collectionName);
}


/**
 * Tạo index nếu index có cùng tên chưa tồn tại.
 */
function createIndexIfMissing(
    collectionName,
    indexFields,
    indexOptions
) {
    const collection = db.getCollection(collectionName);

    const existingIndex = collection
        .getIndexes()
        .find(function (index) {
            return index.name === indexOptions.name;
        });

    if (existingIndex) {
        print(
            "[SKIP INDEX] "
            + collectionName
            + "."
            + indexOptions.name
        );
        return;
    }

    collection.createIndex(
        indexFields,
        indexOptions
    );

    print(
        "[CREATE INDEX] "
        + collectionName
        + "."
        + indexOptions.name
    );
}


/* ============================================================
 * KIỂU DỮ LIỆU DÙNG CHUNG
 * ============================================================ */

const nullableString = {
    bsonType: ["string", "null"]
};

const nullableDate = {
    bsonType: ["date", "null"]
};

const nullableObjectId = {
    bsonType: ["objectId", "null"]
};

const nullableInteger = {
    bsonType: [
        "int",
        "long",
        "double",
        "decimal",
        "null"
    ],
    minimum: 0,
    multipleOf: 1
};

const positiveInteger = {
    bsonType: [
        "int",
        "long",
        "double",
        "decimal"
    ],
    minimum: 1,
    multipleOf: 1
};

const nonNegativeInteger = {
    bsonType: [
        "int",
        "long",
        "double",
        "decimal"
    ],
    minimum: 0,
    multipleOf: 1
};


/* ============================================================
 * 1. COLLECTION USERS
 *
 * Lưu thông tin tài khoản người dùng.
 * ============================================================ */

createOrUpdateCollection("users", {
    $jsonSchema: {
        bsonType: "object",
        title: "User",

        required: [
            "email",
            "passwordHash",
            "displayName",
            "timezone",
            "currency",
            "status",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            email: {
                bsonType: "string",
                minLength: 5,
                maxLength: 254,
                pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            },

            passwordHash: {
                bsonType: "string",
                minLength: 20,
                maxLength: 512
            },

            displayName: {
                bsonType: "string",
                minLength: 2,
                maxLength: 80
            },

            avatarUrl: nullableString,

            timezone: {
                bsonType: "string",
                minLength: 3,
                maxLength: 64
            },

            currency: {
                enum: ["VND"]
            },

            refreshTokenHash: nullableString,

            status: {
                enum: [
                    "ACTIVE",
                    "DISABLED"
                ]
            },

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


/**
 * Email không được trùng.
 */
createIndexIfMissing(
    "users",
    {
        email: 1
    },
    {
        name: "uq_users_email",
        unique: true
    }
);


/**
 * Hỗ trợ tìm user theo trạng thái.
 */
createIndexIfMissing(
    "users",
    {
        status: 1,
        createdAt: -1
    },
    {
        name: "idx_users_status_createdAt"
    }
);


/* ============================================================
 * 2. COLLECTION SAVING_CHALLENGES
 *
 * Challenge board 100 o tiet kiem cua nguoi dung.
 * ============================================================ */

createOrUpdateCollection("saving_challenges", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Challenge",

        required: [
            "userId",
            "name",
            "targetAmount",
            "startDate",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            name: {
                bsonType: "string"
            },

            minNumber: positiveInteger,

            maxNumber: positiveInteger,

            unitAmount: positiveInteger,

            targetAmount: positiveInteger,

            savedAmount: nonNegativeInteger,

            completedCells: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 0,
                maximum: 100,
                multipleOf: 1
            },

            mode: {
                enum: [
                    "ONE_PER_DAY",
                    "FLEXIBLE"
                ]
            },

            selectionMode: {
                enum: [
                    "FREE",
                    "RANDOM",
                    "ASCENDING",
                    "DESCENDING"
                ]
            },

            startDate: {
                bsonType: "date"
            },

            completedAt: nullableDate,

            status: {
                enum: [
                    "ACTIVE",
                    "COMPLETED",
                    "ARCHIVED"
                ]
            },

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});

createIndexIfMissing(
    "saving_challenges",
    {
        userId: 1,
        status: 1
    },
    {
        name: "userId_1_status_1"
    }
);

createIndexIfMissing(
    "saving_challenges",
    {
        userId: 1,
        createdAt: -1
    },
    {
        name: "userId_1_createdAt_-1"
    }
);


/* ============================================================
 * 3. COLLECTION SAVING_CHECKINS
 *
 * Cac lan check-in cua challenge, bao gom ca trang thai reverse.
 * ============================================================ */

createOrUpdateCollection("saving_checkins", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Check-in",

        required: [
            "challengeId",
            "userId",
            "number",
            "amount",
            "localDate",
            "timezone",
            "idempotencyKey",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            challengeId: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            number: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 100,
                multipleOf: 1
            },

            amount: positiveInteger,

            localDate: {
                bsonType: "string",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$"
            },

            timezone: {
                bsonType: "string",
                minLength: 3,
                maxLength: 64
            },

            idempotencyKey: {
                bsonType: "string",
                minLength: 16,
                maxLength: 128
            },

            status: {
                enum: [
                    "COMPLETED",
                    "REVERSED"
                ]
            },

            reversedAt: nullableDate,

            reverseReason: nullableString,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});

createIndexIfMissing(
    "saving_checkins",
    {
        challengeId: 1,
        number: 1
    },
    {
        name: "challengeId_1_number_1",
        unique: true,
        partialFilterExpression: {
            status: "COMPLETED"
        }
    }
);

createIndexIfMissing(
    "saving_checkins",
    {
        challengeId: 1,
        localDate: 1
    },
    {
        name: "challengeId_1_localDate_1",
        unique: true,
        partialFilterExpression: {
            status: "COMPLETED"
        }
    }
);

createIndexIfMissing(
    "saving_checkins",
    {
        userId: 1,
        idempotencyKey: 1
    },
    {
        name: "userId_1_idempotencyKey_1",
        unique: true
    }
);

createIndexIfMissing(
    "saving_checkins",
    {
        challengeId: 1,
        createdAt: -1
    },
    {
        name: "challengeId_1_createdAt_-1"
    }
);


/* ============================================================
 * 4. COLLECTION SAVING_PLANS
 *
 * Lưu kế hoạch tiết kiệm từ 1 đến 300 ngày/lượt.
 * ============================================================ */

createOrUpdateCollection("saving_plans", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Plan",

        required: [
            "userId",
            "name",
            "durationDays",
            "currentDayIndex",
            "completedDays",
            "generationMode",
            "targetAmount",
            "totalSavedAmount",
            "remainingAmount",
            "progressMode",
            "confirmationMode",
            "paymentDestinationMode",
            "paymentExpiresInMinutes",
            "timezone",
            "startDate",
            "status",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            name: {
                bsonType: "string",
                minLength: 2,
                maxLength: 80
            },

            /**
             * Tổng số ngày/lượt tiết kiệm.
             * Tối thiểu 1, tối đa 300.
             */
            durationDays: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            /**
             * Ngày/lượt tiết kiệm hiện tại.
             */
            currentDayIndex: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            completedDays: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 0,
                maximum: 300,
                multipleOf: 1
            },

            /**
             * CLASSIC_SEQUENCE:
             * 1K, 2K, 3K...
             *
             * TARGET_AUTO_DISTRIBUTION:
             * Tự phân bổ theo mục tiêu.
             *
             * CUSTOM_LIST:
             * Người dùng nhập danh sách tùy chỉnh.
             */
            generationMode: {
                enum: [
                    "CLASSIC_SEQUENCE",
                    "TARGET_AUTO_DISTRIBUTION",
                    "CUSTOM_LIST"
                ]
            },

            targetAmount: positiveInteger,

            totalSavedAmount: nonNegativeInteger,

            remainingAmount: nonNegativeInteger,

            unitAmount: nullableInteger,

            minAmount: nullableInteger,

            maxAmount: nullableInteger,

            stepAmount: nullableInteger,

            progressMode: {
                enum: [
                    "FLEXIBLE_CONTRIBUTION_DAYS",
                    "CALENDAR_DAYS"
                ]
            },

            confirmationMode: {
                enum: [
                    "PAYOS_ONLY",
                    "PAYOS_OR_MANUAL"
                ]
            },

            paymentDestinationMode: {
                enum: [
                    "SINGLE_OWNER_CHANNEL",
                    "PLATFORM_CHANNEL"
                ]
            },

            paymentExpiresInMinutes: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 1440,
                multipleOf: 1
            },

            timezone: {
                bsonType: "string",
                minLength: 3,
                maxLength: 64
            },

            startDate: {
                bsonType: "date"
            },

            activatedAt: nullableDate,

            completedAt: nullableDate,

            status: {
                enum: [
                    "DRAFT",
                    "SCHEDULED",
                    "ACTIVE",
                    "PAUSED",
                    "COMPLETED",
                    "ARCHIVED"
                ]
            },

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


createIndexIfMissing(
    "saving_plans",
    {
        userId: 1,
        status: 1
    },
    {
        name: "idx_saving_plans_user_status"
    }
);


createIndexIfMissing(
    "saving_plans",
    {
        userId: 1,
        createdAt: -1
    },
    {
        name: "idx_saving_plans_user_createdAt"
    }
);


createIndexIfMissing(
    "saving_plans",
    {
        status: 1,
        startDate: 1
    },
    {
        name: "idx_saving_plans_status_startDate"
    }
);


/* ============================================================
 * 5. COLLECTION SAVING_SLOTS
 *
 * Danh sách khoản tiền người dùng được chọn.
 *
 * Ví dụ kế hoạch 100 ngày:
 * - Slot 1: 1.000 VNĐ
 * - Slot 2: 2.000 VNĐ
 * - Slot 100: 100.000 VNĐ
 *
 * Slot không gắn trước với ngày.
 * Người dùng đến ngày hiện tại mới chọn slot.
 * ============================================================ */

createOrUpdateCollection("saving_slots", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Slot",

        required: [
            "userId",
            "planId",
            "slotIndex",
            "amount",
            "status",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            planId: {
                bsonType: "objectId"
            },

            slotIndex: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            amount: positiveInteger,

            status: {
                enum: [
                    "AVAILABLE",
                    "RESERVED",
                    "PAID",
                    "MANUALLY_COMPLETED"
                ]
            },

            /**
             * Payment hiện đang giữ slot.
             */
            reservedByPaymentId: nullableObjectId,

            /**
             * Thời điểm reservation hết hạn.
             */
            reservationExpiresAt: nullableDate,

            /**
             * Chỉ được gán sau khi thanh toán thành công.
             */
            assignedDayIndex: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal",
                    "null"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            /**
             * Payment payOS đã thanh toán slot.
             */
            paidPaymentId: nullableObjectId,

            completedAt: nullableDate,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


/**
 * Trong một plan, slotIndex không được trùng.
 */
createIndexIfMissing(
    "saving_slots",
    {
        planId: 1,
        slotIndex: 1
    },
    {
        name: "uq_saving_slots_plan_slotIndex",
        unique: true
    }
);


/**
 * Tìm slot còn lại theo plan, trạng thái và số tiền.
 */
createIndexIfMissing(
    "saving_slots",
    {
        planId: 1,
        status: 1,
        amount: 1
    },
    {
        name: "idx_saving_slots_plan_status_amount"
    }
);


/**
 * Tìm slot thuộc user và plan.
 */
createIndexIfMissing(
    "saving_slots",
    {
        userId: 1,
        planId: 1,
        status: 1
    },
    {
        name: "idx_saving_slots_user_plan_status"
    }
);


/**
 * Một ngày trong plan chỉ được gán một slot hoàn thành.
 *
 * Chỉ áp dụng khi assignedDayIndex là number.
 */
createIndexIfMissing(
    "saving_slots",
    {
        planId: 1,
        assignedDayIndex: 1
    },
    {
        name: "uq_saving_slots_plan_assignedDayIndex",
        unique: true,
        partialFilterExpression: {
            assignedDayIndex: {
                $type: "number"
            }
        }
    }
);


/**
 * Dùng cho job tìm các slot reservation đã hết hạn.
 */
createIndexIfMissing(
    "saving_slots",
    {
        reservationExpiresAt: 1,
        status: 1
    },
    {
        name: "idx_saving_slots_reservationExpiresAt_status"
    }
);


/* ============================================================
 * 6. COLLECTION SAVING_PAYMENTS
 *
 * Lưu payment link và QR payOS.
 * ============================================================ */

createOrUpdateCollection("saving_payments", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Payment",

        required: [
            "userId",
            "planId",
            "slotId",
            "dayIndex",
            "provider",
            "orderCode",
            "amount",
            "currency",
            "description",
            "status",
            "idempotencyKey",
            "expiresAt",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            planId: {
                bsonType: "objectId"
            },

            slotId: {
                bsonType: "objectId"
            },

            dayIndex: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            provider: {
                enum: ["PAYOS"]
            },

            /**
             * Mã đơn hàng gửi sang payOS.
             */
            orderCode: positiveInteger,

            /**
             * ID payment link do payOS trả về.
             */
            paymentLinkId: nullableString,

            amount: positiveInteger,

            currency: {
                enum: ["VND"]
            },

            /**
             * Nội dung chuyển khoản ngắn.
             */
            description: {
                bsonType: "string",
                minLength: 1,
                maxLength: 25
            },

            checkoutUrl: nullableString,

            qrCode: nullableString,

            status: {
                enum: [
                    "CREATING",
                    "PENDING",
                    "PROCESSING",
                    "PAID",
                    "CANCELLED",
                    "EXPIRED",
                    "FAILED"
                ]
            },

            /**
             * UUID do frontend tạo để chống request trùng.
             */
            idempotencyKey: {
                bsonType: "string",
                minLength: 16,
                maxLength: 128
            },

            expiresAt: {
                bsonType: "date"
            },

            paidAt: nullableDate,

            cancelledAt: nullableDate,

            failedAt: nullableDate,

            providerReference: nullableString,

            transactionDateTime: nullableString,

            lastReconciledAt: nullableDate,

            errorCode: nullableString,

            errorMessage: nullableString,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


/**
 * orderCode payOS không được trùng.
 */
createIndexIfMissing(
    "saving_payments",
    {
        orderCode: 1
    },
    {
        name: "uq_saving_payments_orderCode",
        unique: true
    }
);


/**
 * paymentLinkId không được trùng khi đã có giá trị.
 */
createIndexIfMissing(
    "saving_payments",
    {
        paymentLinkId: 1
    },
    {
        name: "uq_saving_payments_paymentLinkId",
        unique: true,
        partialFilterExpression: {
            paymentLinkId: {
                $type: "string"
            }
        }
    }
);


/**
 * Chống cùng một request tạo nhiều payment.
 */
createIndexIfMissing(
    "saving_payments",
    {
        userId: 1,
        idempotencyKey: 1
    },
    {
        name: "uq_saving_payments_user_idempotencyKey",
        unique: true
    }
);


createIndexIfMissing(
    "saving_payments",
    {
        planId: 1,
        status: 1,
        createdAt: -1
    },
    {
        name: "idx_saving_payments_plan_status_createdAt"
    }
);


createIndexIfMissing(
    "saving_payments",
    {
        slotId: 1,
        status: 1
    },
    {
        name: "idx_saving_payments_slot_status"
    }
);


/**
 * Tìm payment quá hạn.
 */
createIndexIfMissing(
    "saving_payments",
    {
        expiresAt: 1,
        status: 1
    },
    {
        name: "idx_saving_payments_expiresAt_status"
    }
);


/**
 * Mỗi ngày chỉ có một payment đang hoạt động.
 *
 * Payment CANCELLED, EXPIRED hoặc FAILED không còn giữ ngày.
 */
createIndexIfMissing(
    "saving_payments",
    {
        planId: 1,
        dayIndex: 1
    },
    {
        name: "uq_saving_payments_one_active_payment_per_day",
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [
                    "CREATING",
                    "PENDING",
                    "PROCESSING"
                ]
            }
        }
    }
);


/**
 * Một slot chỉ có một payment đang hoạt động hoặc đã PAID.
 *
 * Payment CANCELLED, EXPIRED và FAILED không chặn việc tạo payment mới.
 */
createIndexIfMissing(
    "saving_payments",
    {
        slotId: 1
    },
    {
        name: "uq_saving_payments_one_active_or_paid_per_slot",
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [
                    "CREATING",
                    "PENDING",
                    "PROCESSING",
                    "PAID"
                ]
            }
        }
    }
);


/* ============================================================
 * 7. COLLECTION CHALLENGE_PAYMENTS
 *
 * Payment payOS cho tung o trong challenge 100 ngay.
 * ============================================================ */

createOrUpdateCollection("challenge_payments", {
    $jsonSchema: {
        bsonType: "object",
        title: "Challenge Payment",

        required: [
            "userId",
            "challengeId",
            "number",
            "provider",
            "orderCode",
            "amount",
            "currency",
            "description",
            "status",
            "idempotencyKey",
            "expiresAt",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            challengeId: {
                bsonType: "objectId"
            },

            number: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 100,
                multipleOf: 1
            },

            provider: {
                enum: ["PAYOS"]
            },

            orderCode: positiveInteger,

            paymentLinkId: nullableString,

            amount: positiveInteger,

            currency: {
                enum: ["VND"]
            },

            description: {
                bsonType: "string",
                minLength: 1,
                maxLength: 25
            },

            checkoutUrl: nullableString,

            qrCode: nullableString,

            status: {
                enum: [
                    "CREATING",
                    "PENDING",
                    "PROCESSING",
                    "PAID",
                    "CANCELLED",
                    "EXPIRED",
                    "FAILED"
                ]
            },

            idempotencyKey: {
                bsonType: "string",
                minLength: 16,
                maxLength: 128
            },

            expiresAt: {
                bsonType: "date"
            },

            paidAt: nullableDate,

            cancelledAt: nullableDate,

            lastReconciledAt: nullableDate,

            providerReference: nullableString,

            transactionDateTime: nullableString,

            errorCode: nullableString,

            errorMessage: nullableString,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});

createIndexIfMissing(
    "challenge_payments",
    {
        orderCode: 1
    },
    {
        name: "uq_challenge_payments_orderCode",
        unique: true
    }
);

createIndexIfMissing(
    "challenge_payments",
    {
        paymentLinkId: 1
    },
    {
        name: "uq_challenge_payments_paymentLinkId",
        unique: true,
        sparse: true
    }
);

createIndexIfMissing(
    "challenge_payments",
    {
        userId: 1,
        idempotencyKey: 1
    },
    {
        name: "uq_challenge_payments_user_idempotencyKey",
        unique: true
    }
);

createIndexIfMissing(
    "challenge_payments",
    {
        challengeId: 1,
        number: 1,
        status: 1
    },
    {
        name: "idx_challenge_payments_challenge_number_status"
    }
);

createIndexIfMissing(
    "challenge_payments",
    {
        challengeId: 1,
        number: 1
    },
    {
        name: "uq_challenge_payments_one_active_per_cell",
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [
                    "CREATING",
                    "PENDING",
                    "PROCESSING"
                ]
            }
        }
    }
);

createIndexIfMissing(
    "challenge_payments",
    {
        expiresAt: 1,
        status: 1
    },
    {
        name: "idx_challenge_payments_expiresAt_status"
    }
);


/* ============================================================
 * 8. COLLECTION SAVING_DAY_RECORDS
 *
 * Ghi nhận ngày/lượt tiết kiệm đã hoàn thành.
 * Chỉ tạo sau khi payOS xác nhận PAID hoặc ghi nhận manual.
 * ============================================================ */

createOrUpdateCollection("saving_day_records", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Day Record",

        required: [
            "userId",
            "planId",
            "slotId",
            "dayIndex",
            "amount",
            "confirmationSource",
            "status",
            "localCompletedDate",
            "completedAt",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            planId: {
                bsonType: "objectId"
            },

            slotId: {
                bsonType: "objectId"
            },

            paymentId: nullableObjectId,

            dayIndex: {
                bsonType: [
                    "int",
                    "long",
                    "double",
                    "decimal"
                ],
                minimum: 1,
                maximum: 300,
                multipleOf: 1
            },

            amount: positiveInteger,

            confirmationSource: {
                enum: [
                    "PAYOS",
                    "MANUAL"
                ]
            },

            status: {
                enum: [
                    "COMPLETED",
                    "REVERSED"
                ]
            },

            /**
             * Ngày theo timezone người dùng.
             * Ví dụ: 2026-07-29.
             */
            localCompletedDate: {
                bsonType: "string",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$"
            },

            completedAt: {
                bsonType: "date"
            },

            reversedAt: nullableDate,

            reverseReason: nullableString,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


/**
 * Mỗi ngày chỉ có một bản ghi COMPLETED đang hoạt động.
 */
createIndexIfMissing(
    "saving_day_records",
    {
        planId: 1,
        dayIndex: 1
    },
    {
        name: "uq_saving_day_records_active_day",
        unique: true,
        partialFilterExpression: {
            status: "COMPLETED"
        }
    }
);


createIndexIfMissing(
    "saving_day_records",
    {
        planId: 1,
        slotId: 1
    },
    {
        name: "idx_saving_day_records_plan_slot"
    }
);


createIndexIfMissing(
    "saving_day_records",
    {
        userId: 1,
        planId: 1,
        completedAt: -1
    },
    {
        name: "idx_saving_day_records_user_plan_completedAt"
    }
);


/* ============================================================
 * 9. COLLECTION PAYOS_WEBHOOK_EVENTS
 *
 * Lưu thông tin xử lý webhook payOS.
 * Dùng để chống webhook bị xử lý trùng.
 * ============================================================ */

createOrUpdateCollection("payos_webhook_events", {
    $jsonSchema: {
        bsonType: "object",
        title: "payOS Webhook Event",

        required: [
            "signatureHash",
            "verified",
            "processingStatus",
            "receivedAt",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            orderCode: nullableInteger,

            paymentLinkId: nullableString,

            providerReference: nullableString,

            /**
             * Hash của signature hoặc payload định danh webhook.
             */
            signatureHash: {
                bsonType: "string",
                minLength: 16,
                maxLength: 256
            },

            verified: {
                bsonType: "bool"
            },

            processingStatus: {
                enum: [
                    "RECEIVED",
                    "PROCESSED",
                    "IGNORED_DUPLICATE",
                    "FAILED"
                ]
            },

            errorMessage: nullableString,

            receivedAt: {
                bsonType: "date"
            },

            processedAt: nullableDate,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


/**
 * Không xử lý cùng một webhook hai lần.
 */
createIndexIfMissing(
    "payos_webhook_events",
    {
        signatureHash: 1
    },
    {
        name: "uq_payos_webhook_events_signatureHash",
        unique: true
    }
);


/**
 * Mã tham chiếu provider không trùng khi tồn tại.
 */
createIndexIfMissing(
    "payos_webhook_events",
    {
        providerReference: 1
    },
    {
        name: "uq_payos_webhook_events_providerReference",
        unique: true,
        partialFilterExpression: {
            providerReference: {
                $type: "string"
            }
        }
    }
);


createIndexIfMissing(
    "payos_webhook_events",
    {
        orderCode: 1,
        receivedAt: -1
    },
    {
        name: "idx_payos_webhook_events_orderCode_receivedAt"
    }
);


createIndexIfMissing(
    "payos_webhook_events",
    {
        processingStatus: 1,
        receivedAt: -1
    },
    {
        name: "idx_payos_webhook_events_status_receivedAt"
    }
);


/* ============================================================
 * 10. COLLECTION SAVING_EVENTS
 *
 * Audit log nghiệp vụ.
 * ============================================================ */

createOrUpdateCollection("saving_events", {
    $jsonSchema: {
        bsonType: "object",
        title: "Saving Audit Event",

        required: [
            "userId",
            "planId",
            "type",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "objectId"
            },

            userId: {
                bsonType: "objectId"
            },

            planId: {
                bsonType: "objectId"
            },

            slotId: nullableObjectId,

            paymentId: nullableObjectId,

            dayRecordId: nullableObjectId,

            type: {
                enum: [
                    "PLAN_CREATED",
                    "PLAN_STARTED",
                    "PLAN_PAUSED",
                    "PLAN_RESUMED",
                    "PLAN_COMPLETED",
                    "PLAN_ARCHIVED",

                    "SLOT_RESERVED",
                    "SLOT_RELEASED",

                    "PAYMENT_CREATED",
                    "PAYMENT_PAID",
                    "PAYMENT_CANCELLED",
                    "PAYMENT_EXPIRED",
                    "PAYMENT_FAILED",

                    "MANUAL_COMPLETION_CREATED",
                    "DAY_RECORD_REVERSED"
                ]
            },

            previousData: {
                bsonType: [
                    "object",
                    "null"
                ]
            },

            currentData: {
                bsonType: [
                    "object",
                    "null"
                ]
            },

            metadata: {
                bsonType: [
                    "object",
                    "null"
                ]
            },

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            },

            __v: {
                bsonType: [
                    "int",
                    "long",
                    "double"
                ]
            }
        }
    }
});


createIndexIfMissing(
    "saving_events",
    {
        planId: 1,
        createdAt: -1
    },
    {
        name: "idx_saving_events_plan_createdAt"
    }
);


createIndexIfMissing(
    "saving_events",
    {
        userId: 1,
        type: 1,
        createdAt: -1
    },
    {
        name: "idx_saving_events_user_type_createdAt"
    }
);


createIndexIfMissing(
    "saving_events",
    {
        paymentId: 1,
        createdAt: -1
    },
    {
        name: "idx_saving_events_payment_createdAt",
        partialFilterExpression: {
            paymentId: {
                $type: "objectId"
            }
        }
    }
);


/* ============================================================
 * 11. COLLECTION COUNTERS
 *
 * Sinh orderCode payOS duy nhất.
 * ============================================================ */

createOrUpdateCollection("counters", {
    $jsonSchema: {
        bsonType: "object",
        title: "Atomic Counter",

        required: [
            "sequenceValue",
            "createdAt",
            "updatedAt"
        ],

        properties: {
            _id: {
                bsonType: "string",
                minLength: 1,
                maxLength: 100
            },

            sequenceValue: nonNegativeInteger,

            createdAt: {
                bsonType: "date"
            },

            updatedAt: {
                bsonType: "date"
            }
        }
    }
});


/**
 * Chỉ tạo counter nếu chưa tồn tại.
 * Nếu chạy lại script sẽ không reset sequenceValue.
 */
db.counters.updateOne(
    {
        _id: "payos_order_code"
    },
    {
        $setOnInsert: {
            sequenceValue: 100000,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    },
    {
        upsert: true
    }
);

print("[UPSERT COUNTER] payos_order_code");


/* ============================================================
 * KIỂM TRA KẾT QUẢ
 * ============================================================ */

print("");
print("============================================================");
print("DANH SÁCH COLLECTION ĐÃ TẠO");
print("============================================================");

printjson(
    db.getCollectionNames().sort()
);


print("");
print("============================================================");
print("DANH SÁCH INDEX");
print("============================================================");

const collectionsToCheck = [
    "users",
    "saving_challenges",
    "saving_checkins",
    "saving_plans",
    "saving_slots",
    "saving_payments",
    "challenge_payments",
    "saving_day_records",
    "payos_webhook_events",
    "saving_events",
    "counters"
];

collectionsToCheck.forEach(function (collectionName) {
    print("");
    print("COLLECTION: " + collectionName);

    db.getCollection(collectionName)
        .getIndexes()
        .forEach(function (index) {
            print("  - " + index.name);
        });
});


print("");
print("============================================================");
print("PAYOS ORDER CODE COUNTER");
print("============================================================");

printjson(
    db.counters.findOne({
        _id: "payos_order_code"
    })
);


print("");
print("============================================================");
print("HOÀN THÀNH KHỞI TẠO DATABASE: " + DB_NAME);
print("============================================================");
print("");
