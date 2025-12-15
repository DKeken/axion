/**
 * SSH константы для переиспользования
 */

/**
 * Константы для SSH подключений
 */
export const SSH_CONSTANTS = {
  /**
   * Порт SSH по умолчанию
   */
  DEFAULT_PORT: 22,

  /**
   * Таймаут подключения по умолчанию (10 секунд)
   */
  DEFAULT_CONNECTION_TIMEOUT: 10000,

  /**
   * Таймаут выполнения команды по умолчанию (30 секунд)
   */
  DEFAULT_COMMAND_TIMEOUT: 30000,

  /**
   * SSH команды для сбора информации о сервере
   */
  COMMANDS: {
    UNAME_OS: "uname -s",
    UNAME_ARCH: "uname -m",
    NPROC: "nproc",
    FREE_MEMORY: "free -b",
    DOCKER_VERSION: "docker --version 2>&1",
    DOCKER_PS: "docker ps > /dev/null 2>&1 && echo 'ok'",
    CPU_USAGE:
      "grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}'",
  },

  /**
   * Команды для настройки сервера
   */
  SETUP_COMMANDS: {
    // Docker
    CHECK_DOCKER: "docker --version 2>&1",
    INSTALL_DOCKER:
      "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh",
    // Директории
    CREATE_DIRECTORIES:
      "sudo mkdir -p /opt/axion/projects /etc/axion /var/log/axion",
    SET_DIRECTORIES_OWNERSHIP:
      "sudo chown -R axion:axion /opt/axion/projects /etc/axion /var/log/axion 2>/dev/null || sudo chown -R axion:axion /opt/axion /etc/axion /var/log/axion",
    // Пользователь
    CHECK_USER: "id -u axion 2>/dev/null || echo 'not_exists'",
    CREATE_USER: "sudo useradd -m -s /bin/bash axion",
    ADD_USER_TO_DOCKER: "sudo usermod -aG docker axion",
    // Firewall (ufw)
    CHECK_UFW: "which ufw || echo 'not_installed'",
    INSTALL_UFW: "sudo apt-get update && sudo apt-get install -y ufw",
    UFW_ALLOW_SSH: "sudo ufw allow 22/tcp",
    UFW_ALLOW_HTTP: "sudo ufw allow 80/tcp",
    UFW_ALLOW_HTTPS: "sudo ufw allow 443/tcp",
    UFW_ALLOW_DOCKER_SWARM:
      "sudo ufw allow 2377/tcp && sudo ufw allow 7946/tcp && sudo ufw allow 7946/udp && sudo ufw allow 4789/udp",
    UFW_ENABLE: "echo 'y' | sudo ufw enable || sudo ufw --force enable",
  },

  /**
   * Команды для управления/проверки Axion Runner Agent
   */
  AGENT_COMMANDS: {
    /**
     * Проверяет наличие и исполняемость бинаря агента
     * Возвращает AGENT_OK если бинарь существует и исполняется
     */
    CHECK_STATUS:
      "if [ -x /opt/axion-agent/agent ]; then echo 'AGENT_OK'; else echo 'AGENT_MISSING'; fi",
  },

  /**
   * Настройки SSH подключения
   */
  CONNECTION_CONFIG: {
    /**
     * Отключаем строгий host key checking для автоматизации
     * В production можно использовать known_hosts файл
     */
    strictVendor: false,
  },
} as const;
