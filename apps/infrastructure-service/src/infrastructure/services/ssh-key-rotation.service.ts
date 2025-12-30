import { SshEncryptionService } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { ServerRepository } from "@/infrastructure/repositories/server.repository";

type RotationResult = {
  rotated: number;
  failed: number;
  skipped: number;
};

@Injectable()
export class SshKeyRotationService extends BaseService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly sshEncryptionService: SshEncryptionService
  ) {
    super(SshKeyRotationService.name);
  }

  /**
   * Выполняет ротацию зашифрованных SSH секретов для всех серверов
   */
  async rotateKeys(
    oldMasterKey: string,
    newMasterKey: string
  ): Promise<RotationResult> {
    if (!oldMasterKey || !newMasterKey) {
      throw new Error("Old and new master keys are required for rotation");
    }

    if (oldMasterKey === newMasterKey) {
      throw new Error("New master key must differ from the old master key");
    }

    const credentials =
      await this.serverRepository.listCredentialsForRotation();
    let rotated = 0;
    let failed = 0;
    let skipped = 0;

    this.logger.log(
      `Starting SSH credential rotation for ${credentials.length} servers`
    );

    for (const credential of credentials) {
      // Нечего ротировать
      if (!credential.encryptedPrivateKey && !credential.encryptedPassword) {
        skipped += 1;
        continue;
      }

      try {
        const rotatedPrivateKey = credential.encryptedPrivateKey
          ? await this.sshEncryptionService.rotateSecret(
              credential.encryptedPrivateKey,
              oldMasterKey,
              newMasterKey
            )
          : null;

        const rotatedPassword = credential.encryptedPassword
          ? await this.sshEncryptionService.rotateSecret(
              credential.encryptedPassword,
              oldMasterKey,
              newMasterKey
            )
          : null;

        await this.serverRepository.updateEncryptedCredentials(
          credential.id,
          rotatedPrivateKey,
          rotatedPassword
        );

        rotated += 1;
      } catch (error) {
        failed += 1;
        this.logger.error(
          `Failed to rotate SSH secrets for server ${credential.id}`,
          error
        );
      }
    }

    return { rotated, failed, skipped };
  }
}
