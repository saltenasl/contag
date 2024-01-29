-- CreateTable
CREATE TABLE "ClientInvites" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "ClientInvites_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientInvites" ADD CONSTRAINT "ClientInvites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
