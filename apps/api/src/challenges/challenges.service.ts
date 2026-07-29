import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Types, type Model } from "mongoose";
import { ApiError } from "../common/api-error";
import { currentStreak, localDate } from "../common/date";
import type { BoardCell, BoardResponse, Checkin, ChallengeSummary } from "@saving/shared";
import { ChallengeDocument, CheckinDocument } from "../database/schemas";

interface Challenge { id: string; userId: string; name: string; unitAmount: number; targetAmount: number; savedAmount: number; completedCells: number; status: "ACTIVE" | "COMPLETED" | "ARCHIVED"; startDate: string; }
interface StoredCheckin extends Checkin { challengeId: string; userId: string; idempotencyKey: string; }

@Injectable()
export class ChallengesService {
  private readonly challenges = new Map<string, Challenge>();
  private readonly checkins = new Map<string, StoredCheckin>();

  constructor(@Optional() @InjectModel(ChallengeDocument.name) private readonly challengeModel?: Model<ChallengeDocument>, @Optional() @InjectModel(CheckinDocument.name) private readonly checkinModel?: Model<CheckinDocument>) {}

  async onModuleInit(): Promise<void> {
    if (!this.challengeModel || !this.checkinModel) return;
    const [challenges, checkins] = await Promise.all([this.challengeModel.find().exec(), this.checkinModel.find().exec()]);
    for (const doc of challenges) this.challenges.set(doc._id.toString(), { id: doc._id.toString(), userId: doc.userId.toString(), name: doc.name, unitAmount: doc.unitAmount, targetAmount: doc.targetAmount, savedAmount: doc.savedAmount, completedCells: doc.completedCells, status: doc.status, startDate: doc.startDate.toISOString() });
    for (const doc of checkins) this.checkins.set(doc._id.toString(), { id: doc._id.toString(), challengeId: doc.challengeId.toString(), userId: doc.userId.toString(), idempotencyKey: doc.idempotencyKey, number: doc.number, amount: doc.amount, localDate: doc.localDate, status: doc.status, createdAt: this.iso((doc as unknown as { createdAt?: Date }).createdAt), reversedAt: doc.reversedAt?.toISOString() ?? null });
  }

  private ensureChallenge(userId: string): Challenge {
    const existing = [...this.challenges.values()].find((item) => item.userId === userId && item.status === "ACTIVE");
    if (existing) return existing;
    const challenge: Challenge = { id: new Types.ObjectId().toString(), userId, name: "Thử thách tiết kiệm 100 ngày", unitAmount: 1000, targetAmount: 5050000, savedAmount: 0, completedCells: 0, status: "ACTIVE", startDate: localDate(process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh") };
    this.challenges.set(challenge.id, challenge); void this.persistChallenge(challenge);
    return challenge;
  }

  private owned(id: string, userId: string): Challenge { const item = this.challenges.get(id); if (!item || item.userId !== userId) throw new ApiError("CHALLENGE_NOT_FOUND", "Không tìm thấy thử thách.", 404); return item; }
  private challengeCheckins(challengeId: string): StoredCheckin[] { return [...this.checkins.values()].filter((checkin) => checkin.challengeId === challengeId); }
  private summary(item: Challenge): ChallengeSummary { const completed = this.challengeCheckins(item.id).filter((checkin) => checkin.status === "COMPLETED"); return { id: item.id, name: item.name, savedAmount: item.savedAmount, targetAmount: item.targetAmount, completedCells: item.completedCells, totalCells: 100, progressPercent: Number(((item.savedAmount / item.targetAmount) * 100).toFixed(2)), remainingAmount: Math.max(item.targetAmount - item.savedAmount, 0), status: item.status, streak: currentStreak(completed.map((checkin) => checkin.localDate)) }; }

  board(userId: string, id?: string): BoardResponse {
    const challenge = id ? this.owned(id, userId) : this.ensureChallenge(userId);
    const byNumber = new Map(this.challengeCheckins(challenge.id).filter((checkin) => checkin.status === "COMPLETED").map((checkin) => [checkin.number, checkin]));
    const cells: BoardCell[] = Array.from({ length: 100 }, (_, index) => { const number = index + 1; const checkin = byNumber.get(number); return { number, amount: number * challenge.unitAmount, status: checkin ? "COMPLETED" : "AVAILABLE", completedDate: checkin?.localDate ?? null }; });
    const today = localDate(process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh");
    const todayCheckin = this.challengeCheckins(challenge.id).find((checkin) => checkin.localDate === today && checkin.status === "COMPLETED") ?? null;
    return { challenge: this.summary(challenge), cells, today: { localDate: today, checked: Boolean(todayCheckin), checkin: todayCheckin } };
  }

  create(userId: string, name = "Thử thách tiết kiệm 100 ngày"): BoardResponse { const challenge: Challenge = { id: new Types.ObjectId().toString(), userId, name, unitAmount: 1000, targetAmount: 5050000, savedAmount: 0, completedCells: 0, status: "ACTIVE", startDate: localDate(process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh") }; this.challenges.set(challenge.id, challenge); void this.persistChallenge(challenge); return this.board(userId, challenge.id); }
  list(userId: string): ChallengeSummary[] { this.ensureChallenge(userId); return [...this.challenges.values()].filter((item) => item.userId === userId).map((item) => this.summary(item)); }

  checkIn(userId: string, challengeId: string, number: number, idempotencyKey: string): BoardResponse {
    const challenge = this.owned(challengeId, userId);
    if (challenge.status !== "ACTIVE") throw new ApiError("CHALLENGE_NOT_ACTIVE", "Thử thách này không còn hoạt động.");
    if (!Number.isInteger(number) || number < 1 || number > 100) throw new ApiError("CELL_INVALID", "Ô tiết kiệm không hợp lệ.");
    const challengeCheckins = this.challengeCheckins(challenge.id);
    const duplicateKey = challengeCheckins.find((checkin) => checkin.idempotencyKey === idempotencyKey || (checkin.number === number && checkin.status === "COMPLETED"));
    if (duplicateKey) { if (duplicateKey.idempotencyKey === idempotencyKey) return this.board(userId, challengeId); throw new ApiError("CELL_ALREADY_COMPLETED", `Ô số ${number} đã được hoàn thành.`, 409); }
    const today = localDate(process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh");
    if (challengeCheckins.some((checkin) => checkin.localDate === today && checkin.status === "COMPLETED")) throw new ApiError("DAILY_LIMIT_REACHED", "Hôm nay bạn đã tiết kiệm rồi.", 409);
    const checkin: StoredCheckin = { id: new Types.ObjectId().toString(), challengeId, userId, idempotencyKey, number, amount: number * challenge.unitAmount, localDate: today, status: "COMPLETED", createdAt: new Date().toISOString() };
    this.checkins.set(checkin.id, checkin); challenge.savedAmount += checkin.amount; challenge.completedCells += 1; if (challenge.completedCells === 100) challenge.status = "COMPLETED";
    void this.persistCheckin(checkin); void this.persistChallenge(challenge);
    return this.board(userId, challengeId);
  }

  reverse(userId: string, checkinId: string): BoardResponse {
    const checkin = this.checkins.get(checkinId);
    if (!checkin || checkin.userId !== userId || checkin.status !== "COMPLETED") throw new ApiError("CHECKIN_NOT_FOUND", "Không tìm thấy khoản tiết kiệm có thể hoàn tác.", 404);
    const challenge = this.owned(checkin.challengeId, userId); checkin.status = "REVERSED"; checkin.reversedAt = new Date().toISOString(); challenge.savedAmount -= checkin.amount; challenge.completedCells -= 1; if (challenge.status === "COMPLETED") challenge.status = "ACTIVE";
    void this.persistCheckin(checkin); void this.persistChallenge(challenge); return this.board(userId, challenge.id);
  }

  history(userId: string, challengeId: string): Checkin[] { this.owned(challengeId, userId); return this.challengeCheckins(challengeId).filter((checkin) => checkin.status === "COMPLETED" || checkin.status === "REVERSED").sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  statistics(userId: string, challengeId: string) { const challenge = this.owned(challengeId, userId); const items = this.challengeCheckins(challengeId).filter((checkin) => checkin.status === "COMPLETED"); const amounts = items.map((checkin) => checkin.amount); return { totalSaved: challenge.savedAmount, targetAmount: challenge.targetAmount, progressPercent: this.summary(challenge).progressPercent, completedCells: challenge.completedCells, remainingCells: 100 - challenge.completedCells, averagePerDay: items.length ? Math.round(challenge.savedAmount / items.length) : 0, largestAmount: amounts.length ? Math.max(...amounts) : 0, smallestAmount: amounts.length ? Math.min(...amounts) : 0, currentStreak: this.summary(challenge).streak, bestStreak: this.summary(challenge).streak, startDate: challenge.startDate, expectedCompletionDate: null }; }
  random(userId: string, challengeId: string): { number: number; amount: number } { const board = this.board(userId, challengeId); const available = board.cells.filter((cell) => cell.status === "AVAILABLE"); if (!available.length) throw new ApiError("CHALLENGE_COMPLETED", "Bạn đã hoàn thành toàn bộ thử thách."); const pick = available[Math.floor(Math.random() * available.length)]; return { number: pick.number, amount: pick.amount }; }

  private objectId(value: string): Types.ObjectId { return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : new Types.ObjectId(); }
  private iso(value: Date | string | undefined): string { return value instanceof Date ? value.toISOString() : value ?? new Date().toISOString(); }
  private async persistChallenge(challenge: Challenge): Promise<void> { if (!this.challengeModel) return; await this.challengeModel.updateOne({ _id: this.objectId(challenge.id) }, { $set: { userId: this.objectId(challenge.userId), name: challenge.name, minNumber: 1, maxNumber: 100, unitAmount: challenge.unitAmount, targetAmount: challenge.targetAmount, savedAmount: challenge.savedAmount, completedCells: challenge.completedCells, startDate: new Date(challenge.startDate), status: challenge.status } }, { upsert: true }).exec(); }
  private async persistCheckin(checkin: StoredCheckin): Promise<void> { if (!this.checkinModel) return; await this.checkinModel.updateOne({ _id: this.objectId(checkin.id) }, { $set: { challengeId: this.objectId(checkin.challengeId), userId: this.objectId(checkin.userId), number: checkin.number, amount: checkin.amount, localDate: checkin.localDate, timezone: process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh", idempotencyKey: checkin.idempotencyKey, status: checkin.status, reversedAt: checkin.reversedAt ? new Date(checkin.reversedAt) : null } }, { upsert: true }).exec(); }
}
