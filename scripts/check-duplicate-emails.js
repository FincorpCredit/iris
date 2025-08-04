import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateEmails() {
  try {
    console.log('Checking for duplicate customer emails...');
    
    // Find duplicate emails
    const duplicates = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM customer 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate emails found. Safe to proceed with migration.');
      return;
    }
    
    console.log('⚠️  Found duplicate emails:');
    duplicates.forEach(dup => {
      console.log(`  - ${dup.email}: ${dup.count} occurrences`);
    });
    
    // Get all customers to see the data
    const allCustomers = await prisma.customer.findMany({
      orderBy: { email: 'asc' }
    });
    
    console.log('\nAll customers:');
    allCustomers.forEach(customer => {
      console.log(`  - ID: ${customer.id}, Email: ${customer.email}, Name: ${customer.name}`);
    });
    
    // For each duplicate email, keep the oldest record and delete the rest
    for (const duplicate of duplicates) {
      const customersWithEmail = await prisma.customer.findMany({
        where: { email: duplicate.email },
        orderBy: { createdAt: 'asc' }
      });
      
      const keepCustomer = customersWithEmail[0];
      const deleteCustomers = customersWithEmail.slice(1);
      
      console.log(`\nFor email ${duplicate.email}:`);
      console.log(`  Keeping: ${keepCustomer.id} (${keepCustomer.name})`);
      
      for (const deleteCustomer of deleteCustomers) {
        console.log(`  Would delete: ${deleteCustomer.id} (${deleteCustomer.name})`);
        
        // Move any chats to the kept customer
        await prisma.chat.updateMany({
          where: { customerId: deleteCustomer.id },
          data: { customerId: keepCustomer.id }
        });
        
        // Delete the duplicate customer
        await prisma.customer.delete({
          where: { id: deleteCustomer.id }
        });
        
        console.log(`  ✅ Deleted duplicate customer and moved chats`);
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed. Safe to proceed with migration.');
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateEmails();
