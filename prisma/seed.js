// prisma/seed.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import generateKnowledgeTags from "../src/lib/knowledge-tags.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const prisma = new PrismaClient();

async function main() {
  // Create roles
  const roles = [
    {
      name: "admin",
      permissions: {
        canManageUsers: true,
        canManageChats: true,
        canViewReports: true,
        canManageSystem: true
      }
    },
    {
      name: "agent",
      permissions: {
        canManageUsers: false,
        canManageChats: true,
        canViewReports: false,
        canManageSystem: false
      }
    },
    {
      name: "customer",
      permissions: {
        canManageUsers: false,
        canManageChats: false,
        canViewReports: false,
        canManageSystem: false
      }
    }
  ];
  const roleMap = {};

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        name: roleData.name,
        permissions: roleData.permissions
      },
    });
    roleMap[roleData.name] = role.id;
  }

  // Seed admin user
  const email = "maildaviesevan@gmail.com";
  const plainPassword = "password";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Davies Evan",
      passwordHash,
      roleId: roleMap["admin"],
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      mustChangePassword: false,
      // passwordChangedAt is optional and can be omitted
    },
  });

  // Load permissions from JSON
  const permissionsData = JSON.parse(
    readFileSync(join(__dirname, "permissions.json"), "utf8")
  );

  for (const group of permissionsData) {
    const roleId = roleMap[group.role];
    for (const perm of group.permissions) {
      await prisma.permission.upsert({
        where: {
          roleId_resource_action: {
            roleId,
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {},
        create: {
          roleId,
          resource: perm.resource,
          action: perm.action,
        },
      });
    }
  }

  // Load knowledge data from JSON
  const knowledgeData = JSON.parse(
    readFileSync(join(__dirname, "knowledge.json"), "utf8")
  );

  for (const item of knowledgeData) {
    const knowledge = await prisma.companyknowledge.upsert({
      where: { title: item.title },
      update: {
        content: item.content,
      },
      create: {
        title: item.title,
        content: item.content,
      },
    });

    // Generate tags using Mistral AI
    const generatedTags = await generateKnowledgeTags(item.title, item.content);

    // Create tags for the knowledge item
    for (const tagName of generatedTags) {
      await prisma.knowledgetag.upsert({
        where: {
          id: `${knowledge.id}-${tagName}`, // Using a compound unique identifier
        },
        update: {},
        create: {
          name: tagName,
          knowledgeId: knowledge.id,
        },
      });
    }
  }

  console.log(
    ">>>>>>>>> Roles, admin, permissions, and knowledge base seeded."
  );
}

main()
  .catch((e) => {
    console.error(">>>>>>>>>>>> Error seeding:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
