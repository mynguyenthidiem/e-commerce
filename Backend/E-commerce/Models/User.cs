using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        [Required(ErrorMessage = "Name is required."), StringLength(100)]
        public string Name { get; set; }
        [Required(ErrorMessage ="Password is required."), StringLength(100)]
        public string Password { get; set; }
        [Required(ErrorMessage = "Email is required."), StringLength(100),EmailAddress]
        public string Email { get; set; }
        [StringLength(100)]
        public string? FullName { get; set; }
        [StringLength(10)]
        public string PhoneNumber { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        [Column(TypeName = "decimal(18,2)"), Range(0,double.MaxValue)]
        public decimal totalSpend { get; set; } = 0;
        public bool IsDeleted { get; set; } = false;

        public virtual Cart Cart { get; set; }

        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public virtual ICollection<SupportRequest> SupportRequests { get; set; } = new List<SupportRequest>();


    }
}
